using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Activation;
using System.ServiceModel.Web;
using System.Web.SessionState;
using Terrasoft.Core.DB;
using Terrasoft.Web.Common;

namespace UsrAviationApp.EntryPoints.WebServices {

	[DataContract]
	public class LeadRequest {
		[DataMember(Name = "Email")] public string Email { get; set; }
		[DataMember(Name = "FirstName")] public string FirstName { get; set; }
		[DataMember(Name = "LastName")] public string LastName { get; set; }
		[DataMember(Name = "Phone")] public string Phone { get; set; }
		[DataMember(Name = "SessionId")] public string SessionId { get; set; }
		[DataMember(Name = "PageUrl")] public string PageUrl { get; set; }
	}

	[DataContract]
	public class LeadResponse {
		[DataMember(Name = "Success")] public bool Success { get; set; }
		[DataMember(Name = "ContactId")] public string ContactId { get; set; }
		[DataMember(Name = "Error")] public string Error { get; set; }
	}

	[DataContract]
	public class TrackEventDto {
		[DataMember(Name = "EventType")] public string EventType { get; set; }
		[DataMember(Name = "PageUrl")] public string PageUrl { get; set; }
		// Pre-stringified JSON from the client (mirrors UsrEventData), not a
		// nested object — DataContractJsonSerializer handles arbitrary
		// dictionaries poorly, so the client stringifies before sending.
		[DataMember(Name = "Data")] public string Data { get; set; }
		[DataMember(Name = "ContactId")] public string ContactId { get; set; }
	}

	[DataContract]
	public class TrackRequest {
		[DataMember(Name = "SessionId")] public string SessionId { get; set; }
		[DataMember(Name = "Events")] public List<TrackEventDto> Events { get; set; }
	}

	[DataContract]
	public class TrackResponse {
		[DataMember(Name = "Success")] public bool Success { get; set; }
		[DataMember(Name = "Inserted")] public int Inserted { get; set; }
		[DataMember(Name = "Error")] public string Error { get; set; }
	}

	[ServiceContract]
	[AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
	public class CaptureService : BaseService, IReadOnlySessionState {

		// EDIT THIS to match the exact origin(s) your app is served from.
		// Must be exact — no wildcards, no trailing slash.
		// NOTE (srilankan-airlines-web port): the old Next.js demo used
		// localhost:3000 and aviation-demo-five.vercel.app. This Vite rebuild
		// serves dev on localhost:5173 by default, and its own Vercel
		// production domain — both need to be added here (and this file
		// recompiled in Creatio) before browser calls from this repo will
		// pass CORS.
		private static readonly string[] AllowedOrigins = {
			"http://localhost:3000",
			"https://aviation-demo-five.vercel.app",
			"http://localhost:5173"
		};

		// Demo-grade in-memory limiter: scoped to one IIS worker process, not
		// shared across instances or restarts. It exists specifically because
		// the credential calling this service lives in public browser code —
		// this blunts casual abuse of it, it is not a substitute for a real
		// distributed limiter under production traffic.
		private static readonly ConcurrentDictionary<string, Queue<DateTime>> RequestLog =
			new ConcurrentDictionary<string, Queue<DateTime>>();
		private const int MaxRequestsPerWindow = 30;
		private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

		private void SetCorsHeaders() {
			string origin = System.Web.HttpContext.Current?.Request?.Headers["Origin"];
			if (origin == null || !AllowedOrigins.Contains(origin)) {
				return;
			}
			var response = System.Web.HttpContext.Current.Response;
			response.Headers["Access-Control-Allow-Origin"] = origin;
			response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
			response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
			response.Headers["Access-Control-Max-Age"] = "600";
		}

		private bool IsRateLimited(string key) {
			if (string.IsNullOrEmpty(key)) {
				key = System.Web.HttpContext.Current?.Request?.UserHostAddress ?? "unknown";
			}
			var now = DateTime.UtcNow;
			var log = RequestLog.GetOrAdd(key, _ => new Queue<DateTime>());
			lock (log) {
				while (log.Count > 0 && now - log.Peek() > Window) {
					log.Dequeue();
				}
				if (log.Count >= MaxRequestsPerWindow) {
					return true;
				}
				log.Enqueue(now);
				return false;
			}
		}

		private void SetStatusCode(int statusCode) {
			WebOperationContext.Current.OutgoingResponse.StatusCode = (HttpStatusCode)statusCode;
		}

		private string NameFor(string eventType) {
			string raw = $"{eventType} @ {DateTime.UtcNow:o}";
			return raw.Length > 250 ? raw.Substring(0, 250) : raw;
		}

		// --- CORS preflight handlers ---------------------------------------
		// Cross-origin POST with a JSON body + Authorization header is not a
		// CORS "simple request", so the browser sends an OPTIONS preflight
		// first. Without these, the preflight gets no CORS headers and the
		// browser blocks the real request before it's even sent.

		[OperationContract]
		[WebInvoke(Method = "OPTIONS", UriTemplate = "Lead")]
		public void LeadOptions() {
			SetCorsHeaders();
		}

		[OperationContract]
		[WebInvoke(Method = "OPTIONS", UriTemplate = "Track")]
		public void TrackOptions() {
			SetCorsHeaders();
		}

		// --- Diagnostics -----------------------------------------------------

		[OperationContract]
		[WebInvoke(Method = "GET", RequestFormat = WebMessageFormat.Json,
			ResponseFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Bare)]
		public string Ping() {
			SetCorsHeaders();
			return "{\"status\":\"accepted\"}";
		}

		// --- Lead: upsert Contact, log LeadCaptured, backfill session -----

		[OperationContract]
		[WebInvoke(Method = "POST", UriTemplate = "Lead", RequestFormat = WebMessageFormat.Json,
			ResponseFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Bare)]
		public LeadResponse Lead(LeadRequest request) {
			SetCorsHeaders();
			var model = request ?? new LeadRequest();

			if (string.IsNullOrWhiteSpace(model.Email)) {
				SetStatusCode(400);
				return new LeadResponse { Success = false, Error = "Email is required." };
			}
			if (IsRateLimited(model.SessionId)) {
				SetStatusCode(429);
				return new LeadResponse { Success = false, Error = "Too many requests." };
			}

			try {
				string contactId = UpsertContact(model);
				string eventData = "{\"email\":\"" + model.Email.Replace("\"", "\\\"") + "\"}";
				LogActivity(model.SessionId, "LeadCaptured", model.PageUrl, contactId, eventData);
				BackfillSession(model.SessionId, contactId);
				return new LeadResponse { Success = true, ContactId = contactId };
			} catch (Exception ex) {
				SetStatusCode(500);
				return new LeadResponse { Success = false, Error = ex.Message };
			}
		}

		// --- Track: bulk-insert activity events ----------------------------

		[OperationContract]
		[WebInvoke(Method = "POST", UriTemplate = "Track", RequestFormat = WebMessageFormat.Json,
			ResponseFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Bare)]
		public TrackResponse Track(TrackRequest request) {
			SetCorsHeaders();
			var model = request ?? new TrackRequest();

			if (string.IsNullOrWhiteSpace(model.SessionId) || model.Events == null || model.Events.Count == 0) {
				SetStatusCode(400);
				return new TrackResponse { Success = false, Error = "SessionId and at least one event are required." };
			}
			if (IsRateLimited(model.SessionId)) {
				SetStatusCode(429);
				return new TrackResponse { Success = false, Error = "Too many requests." };
			}

			int inserted = 0;
			foreach (var evt in model.Events) {
				try {
					LogActivity(model.SessionId, evt.EventType, evt.PageUrl, evt.ContactId, evt.Data);
					inserted++;
				} catch {
					// Best-effort per event, matches the old Promise.allSettled
					// behavior — one bad event shouldn't drop the whole batch.
				}
			}
			return new TrackResponse { Success = true, Inserted = inserted };
		}

		// --- Data access -----------------------------------------------------

		private string UpsertContact(LeadRequest model) {
			string existingId = null;
			var select = new Select(UserConnection)
				.Column("Id")
				.From("Contact")
				.Where("Email").IsEqual(Column.Parameter(model.Email)) as Select;
			using (var reader = select.ExecuteReader(UserConnection.EnsureDBConnection())) {
				if (reader.Read()) {
					existingId = reader.GetColumnValueGuid("Id").ToString();
				}
			}

			bool hasName = !string.IsNullOrWhiteSpace(model.FirstName) || !string.IsNullOrWhiteSpace(model.LastName);
			string fullName = string.Join(" ",
				new[] { model.FirstName, model.LastName }.Where(s => !string.IsNullOrWhiteSpace(s)));

			if (existingId != null) {
				var update = new Update(UserConnection, "Contact")
					.Set("Email", Column.Parameter(model.Email))
					.Where("Id").IsEqual(Column.Parameter(new Guid(existingId))) as Update;
				if (!string.IsNullOrWhiteSpace(model.FirstName)) update.Set("GivenName", Column.Parameter(model.FirstName));
				if (!string.IsNullOrWhiteSpace(model.LastName)) update.Set("Surname", Column.Parameter(model.LastName));
				if (hasName) update.Set("Name", Column.Parameter(fullName));
				if (!string.IsNullOrWhiteSpace(model.Phone)) update.Set("MobilePhone", Column.Parameter(model.Phone));
				update.Execute();
				return existingId;
			}

			var newId = Guid.NewGuid();
			var insert = new Insert(UserConnection)
				.Into("Contact")
				.Set("Id", Column.Parameter(newId))
				.Set("Email", Column.Parameter(model.Email))
				.Set("Name", Column.Parameter(hasName ? fullName : model.Email)) as Insert;
			if (!string.IsNullOrWhiteSpace(model.FirstName)) insert.Set("GivenName", Column.Parameter(model.FirstName));
			if (!string.IsNullOrWhiteSpace(model.LastName)) insert.Set("Surname", Column.Parameter(model.LastName));
			if (!string.IsNullOrWhiteSpace(model.Phone)) insert.Set("MobilePhone", Column.Parameter(model.Phone));
			insert.Execute();
			return newId.ToString();
		}

		private void LogActivity(string sessionId, string eventType, string pageUrl, string contactId, string data) {
			var insert = new Insert(UserConnection)
				.Into("UsrWebActivity")
				.Set("Id", Column.Parameter(Guid.NewGuid()))
				.Set("Name", Column.Parameter(NameFor(eventType)))
				.Set("UsrSessionId", Column.Parameter(sessionId))
				.Set("UsrEventType", Column.Parameter(eventType))
				.Set("UsrPageUrl", Column.Parameter(pageUrl ?? string.Empty)) as Insert;
			if (!string.IsNullOrEmpty(data)) {
				insert.Set("UsrEventData", Column.Parameter(data.Length > 4000 ? data.Substring(0, 4000) : data));
			}
			if (!string.IsNullOrEmpty(contactId)) {
				insert.Set("UsrContactId", Column.Parameter(new Guid(contactId)));
			}
			insert.Execute();
		}

		private void BackfillSession(string sessionId, string contactId) {
			if (string.IsNullOrEmpty(sessionId) || string.IsNullOrEmpty(contactId)) return;
			var update = new Update(UserConnection, "UsrWebActivity")
				.Set("UsrContactId", Column.Parameter(new Guid(contactId)))
				.Where("UsrSessionId").IsEqual(Column.Parameter(sessionId))
				.And("UsrContactId").IsNull() as Update;
			update.Execute();
		}
	}
}
