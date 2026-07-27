// "use client";
//
// import React, { useState, useEffect } from "react";
import Dashboard from "@/components/analytics/DynamicMap";
// import { motion, AnimatePresence } from "framer-motion";
// import { Ticket, ComplaintResponseData } from "@/lib/types";
// import {
//   submitComplaintApi,
//   fetchTicketsApi,
//   updateTicketStatusApi,
//   simulateSlaEscalation,
//   escalateTicketApi,
//   BASE_URL,
// } from "@/lib/api";
//
// import CRMDashboard from "@/components/analytics/CRMDashboard";
//
export default function App() {
  return (
    <>
      <Dashboard />
    </>
  );
}
// export default function App() {
//   // State
//   const [tickets, setTickets] = useState<Ticket[]>([]);
//   const [complaintText, setComplaintText] = useState("");
//   const [area, setArea] = useState("Anand Vihar");
//   const [lat, setLat] = useState("28.646");
//   const [lng, setLng] = useState("77.316");
//   const [channel, setChannel] = useState("web");
//   const [photoUrl, setPhotoUrl] = useState("");
//   const [aiOutput, setAiOutput] = useState<ComplaintResponseData | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const [activeTab, setActiveTab] = useState<string>("Overview");
//   const [simulatedTimeOffset, setSimulatedTimeOffset] = useState<number>(0);
//   const [ticketFilter, setTicketFilter] = useState<string>("All");
//   const [now, setNow] = useState<number>(0);
//
//   // Load initial data
//   useEffect(() => {
//     async function loadData() {
//       try {
//         const [ticketsRes] = await Promise.all([
//           fetchTicketsApi(),
//           // fetchHotspotsApi(),
//         ]);
//         if (ticketsRes.success) setTickets(ticketsRes.data);
//         // if (hotspotsRes.success) setHotspots(hotspotsRes.data.buckets);
//       } catch (error) {
//         console.error("Failed to load initial data:", error);
//       }
//     }
//     loadData();
//
//     // 2. Open an SSE connection to listen for background updates
//     // This assumes you create a new endpoint that pushes events
//     const eventSource = new EventSource(`${BASE_URL}/tickets/stream`);
//
//     eventSource.onmessage = (event) => {
//       try {
//         const updatedTicket = JSON.parse(event.data);
//
//         // Update the specific ticket in the React state immediately
//         setTickets((prev) =>
//           prev.map((t) =>
//             t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t,
//           ),
//         );
//       } catch (err) {
//         console.error("Error parsing real-time ticket update:", err);
//       }
//     };
//
//     eventSource.onerror = (error) => {
//       console.error("SSE connection error", error);
//       // EventSource will automatically try to reconnect
//     };
//
//     // 3. Cleanup the connection when the component unmounts
//     return () => {
//       eventSource.close();
//     };
//   }, []);
//
//   useEffect(() => {
//     const frameId = requestAnimationFrame(() => {
//       setNow(Date.now());
//     });
//
//     const intervalId = setInterval(() => {
//       setNow(Date.now());
//     }, 1000);
//
//     return () => {
//       cancelAnimationFrame(frameId);
//       clearInterval(intervalId);
//     };
//   }, []);
//
//   // Handlers
//   const handleComplaintSubmit = async (
//     e: React.SubmitEvent<HTMLFormElement>,
//   ) => {
//     e.preventDefault();
//     if (!complaintText.trim()) return;
//
//     setIsSubmitting(true);
//
//     const payload = {
//       text: complaintText.trim(),
//       location: {
//         lat: parseFloat(lat) || 0.0,
//         lng: parseFloat(lng) || 0.0,
//         area: area.trim() || "Unknown Area",
//       },
//       photo_url: photoUrl.trim() || null,
//       channel: channel,
//       submitted_at: new Date().toISOString(),
//     };
//
//     try {
//       const res = await submitComplaintApi(payload);
//
//       if (res.success) {
//         setAiOutput(res.data);
//         if (res.data.ticket_id) {
//           const newTicket: Ticket = {
//             id: res.data.ticket_id,
//             complaint_id: res.data.id,
//             status: "Open",
//             priority_tier: res.data.priority_tier as Ticket["priority_tier"],
//             category: res.data.category,
//             current_tier: 1,
//             assigned_officer_name: "Field Inspector - Zone A",
//             assigned_officer_contact: "+91-9000000001",
//             sla_deadline: new Date(Date.now() + 30 * 60000).toISOString(),
//             created_at: new Date().toISOString(),
//           };
//
//           setTickets((prev) => [newTicket, ...prev]);
//         }
//       }
//     } catch (error) {
//       console.error("Error submitting complaint:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
//
//   const handleStatusChange = async (ticketId: string, newStatus: string) => {
//     setTickets((prev) =>
//       prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
//     );
//     await updateTicketStatusApi(ticketId, newStatus);
//   };
//
//   const handleAdvanceTime = (minutes: number) => {
//     setSimulatedTimeOffset((prev) => prev + minutes);
//     setTickets((prev) => simulateSlaEscalation(prev, minutes));
//   };
//
//   // Filtered tickets
//   const filteredTickets = tickets.filter((t) => {
//     if (ticketFilter === "P1 Urgent")
//       return t.priority_tier.toUpperCase() === "P1";
//     if (ticketFilter === "In Progress")
//       return (
//         t.status.toLowerCase() === "in progress" || t.status === "in_progress"
//       );
//     if (ticketFilter === "Escalated")
//       return t.status === "Escalated" || t.current_tier > 1;
//     return true;
//   });
//
//   const handleEscalate = async (ticketId: string) => {
//     const response = await escalateTicketApi(ticketId);
//
//     if (!response.success || !response.data) {
//       console.error(response.error);
//       return;
//     }
//
//     const updatedTicket = response.data;
//
//     setTickets((prev) =>
//       prev.map((ticket) =>
//         ticket.id === ticketId
//           ? {
//               ...ticket,
//               status: updatedTicket.status,
//               current_tier: updatedTicket.current_tier,
//               assigned_officer_name: updatedTicket.assigned_officer_name,
//               assigned_officer_contact: updatedTicket.assigned_officer_contact,
//               sla_deadline: updatedTicket.sla_deadline,
//             }
//           : ticket,
//       ),
//     );
//   };
//
//   return (
//     <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
//       {/* Top Navigation matching reference image */}
//       <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-3.5">
//         <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
//           {/* Left Group: Branding + Navigation */}
//           <div className="flex items-center gap-8">
//             <div className="flex items-center gap-2.5">
//               <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold tracking-wider shadow-sm shadow-blue-500/20">
//                 AW
//               </div>
//               <span className="font-semibold text-lg tracking-tight text-slate-900">
//                 AirWatch{" "}
//                 <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
//                   DPCC CRM
//                 </span>
//               </span>
//             </div>
//
//             {/* Pill Navigation */}
//             <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
//               {["Overview", "Complaints", "Tickets", "Hotspots"].map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
//                     activeTab === tab
//                       ? "bg-white text-slate-900 shadow-sm font-semibold"
//                       : "text-slate-600 hover:text-slate-900"
//                   }`}
//                 >
//                   {tab}
//                 </button>
//               ))}
//             </nav>
//           </div>
//
//           {/* Right Controls & SLA Clock Simulator */}
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-full">
//               <span className="relative flex h-2 w-2">
//                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
//                 <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
//               </span>
//               <span className="text-xs font-medium text-amber-900">
//                 SLA Clock:{" "}
//                 <strong className="font-semibold">
//                   +{simulatedTimeOffset}m
//                 </strong>
//               </span>
//               <button
//                 onClick={() => handleAdvanceTime(30)}
//                 className="ml-1 text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium px-2 py-0.5 rounded transition-colors shadow-2xs"
//                 title="Fast-forward time by 30 mins to trigger SLA breaches and re-assign officers"
//               >
//                 +30m Skip
//               </button>
//             </div>
//
//             <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
//               SN
//             </div>
//           </div>
//         </div>
//       </header>
//
//       <main className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
//         {/* Top Summary Metric Cards */}
//         <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
//           <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
//             <div className="flex justify-between items-start">
//               <span className="text-sm font-medium text-slate-500">
//                 Active Complaints
//               </span>
//               <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
//                 +14 today
//               </span>
//             </div>
//             <div className="mt-4 flex items-baseline justify-between">
//               <span className="text-3xl font-bold tracking-tight text-slate-900">
//                 34
//               </span>
//               <span className="text-xs text-slate-400">Anand Vihar Peak</span>
//             </div>
//           </div>
//
//           <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
//             <div className="flex justify-between items-start">
//               <span className="text-sm font-medium text-slate-500">
//                 SLA Breaches (24h)
//               </span>
//               <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
//                 Action Req
//               </span>
//             </div>
//             <div className="mt-4 flex items-baseline justify-between">
//               <span className="text-3xl font-bold tracking-tight text-slate-900">
//                 {tickets.filter((t) => t.current_tier > 1).length}
//               </span>
//               <span className="text-xs text-slate-400">
//                 Auto-escalated to Tier 2/3
//               </span>
//             </div>
//           </div>
//
//           <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
//             <div className="flex justify-between items-start">
//               <span className="text-sm font-medium text-slate-500">
//                 Avg Triage Speed
//               </span>
//               <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
//                 LLM V2
//               </span>
//             </div>
//             <div className="mt-4 flex items-baseline justify-between">
//               <span className="text-3xl font-bold tracking-tight text-slate-900">
//                 1.2s
//               </span>
//               <span className="text-xs text-slate-400">
//                 Real-time processing
//               </span>
//             </div>
//           </div>
//         </section>
//
//         {/* Main Workspace Layout (~65% left / ~35% right) */}
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//           {/* LEFT COLUMN: Hotspot Analytics & Tickets Table (~8 cols) */}
//           <div className="lg:col-span-8 space-y-6">
//             {/* Manage Tickets Table */}
//             <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//                 <div>
//                   <h2 className="text-base font-semibold text-slate-900">
//                     Manage Enforcement Tickets
//                   </h2>
//                   <p className="text-xs text-slate-500 mt-0.5">
//                     Live officer assignments and automated SLA tracking
//                   </p>
//                 </div>
//
//                 {/* Table Filter Tabs */}
//                 <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-medium">
//                   {["All", "P1 Urgent", "In Progress", "Escalated"].map(
//                     (tab) => (
//                       <button
//                         key={tab}
//                         onClick={() => setTicketFilter(tab)}
//                         className={`px-3 py-1 rounded-lg transition-all ${
//                           ticketFilter === tab
//                             ? "bg-white text-slate-900 shadow-2xs font-semibold"
//                             : "text-slate-600 hover:text-slate-900"
//                         }`}
//                       >
//                         {tab}
//                       </button>
//                     ),
//                   )}
//                 </div>
//               </div>
//
//               <div className="overflow-x-auto">
//                 <table className="w-full text-left border-collapse">
//                   <thead>
//                     <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
//                       <th className="pb-3 pl-2">Ticket / Complaint</th>
//                       <th className="pb-3">Category & Tier</th>
//                       <th className="pb-3">Assigned Officer</th>
//                       <th className="pb-3">Status</th>
//                       <th className="pb-3 text-right pr-2">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100 text-xs">
//                     <AnimatePresence>
//                       {filteredTickets.map((t) => {
//                         const isBreached =
//                           now > 0 && new Date(t.sla_deadline).getTime() < now;
//                         return (
//                           <motion.tr
//                             key={t.id}
//                             initial={{ opacity: 0 }}
//                             animate={{ opacity: 1 }}
//                             exit={{ opacity: 0 }}
//                             className="hover:bg-slate-50/80 transition-colors group"
//                           >
//                             <td className="py-3.5 pl-2">
//                               <div className="font-semibold text-slate-900">
//                                 {t.id.slice(0, 8)}...
//                               </div>
//                               <div className="text-[10px] text-slate-400 font-mono mt-0.5">
//                                 CMP: {t.complaint_id.slice(0, 8)}
//                               </div>
//                             </td>
//                             <td className="py-3.5">
//                               <div className="font-medium text-slate-800">
//                                 {t.category}
//                               </div>
//                               <div className="flex items-center gap-1.5 mt-1">
//                                 <span
//                                   className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
//                                     t.priority_tier.toUpperCase() === "P1"
//                                       ? "bg-rose-100 text-rose-700"
//                                       : "bg-amber-100 text-amber-700"
//                                   }`}
//                                 >
//                                   {t.priority_tier}
//                                 </span>
//                                 <span
//                                   className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
//                                     t.current_tier > 1
//                                       ? "bg-purple-100 text-purple-700"
//                                       : "bg-slate-100 text-slate-600"
//                                   }`}
//                                 >
//                                   Tier {t.current_tier}
//                                 </span>
//                               </div>
//                             </td>
//                             <td className="py-3.5">
//                               <div className="font-medium text-slate-800">
//                                 {t.assigned_officer_name}
//                               </div>
//                               <div className="text-[11px] text-slate-500 mt-0.5">
//                                 {t.assigned_officer_contact}
//                               </div>
//                             </td>
//                             <td className="py-3.5">
//                               <span
//                                 className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
//                                   t.status === "Closed"
//                                     ? "bg-emerald-50 text-emerald-700 border-emerald-200"
//                                     : t.status === "Escalated"
//                                       ? "bg-rose-50 text-rose-700 border-rose-200 font-semibold"
//                                       : t.status.toLowerCase() === "in progress" ||
//                                         t.status === "in_progress"
//                                         ? "bg-blue-50 text-blue-700 border-blue-200"
//                                         : "bg-slate-100 text-slate-700 border-slate-200"
//                                 }`}
//                               >
//                                 {t.status}
//                               </span>
//                               {isBreached && t.status !== "Closed" && (
//                                 <div className="text-[10px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
//                                   <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>{" "}
//                                   SLA Breached
//                                 </div>
//                               )}
//                             </td>
//                             <td className="py-3.5 text-right pr-2">
//                               <div className="flex items-center justify-end gap-1.5">
//                                 <select
//                                   value={t.status}
//                                   onChange={(e) =>
//                                     handleStatusChange(t.id, e.target.value)
//                                   }
//                                   className="text-xs bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 font-medium text-slate-700 cursor-pointer shadow-2xs focus:outline-hidden"
//                                 >
//                                   <option value="Open">Open</option>
//                                   <option value="In Progress">In Progress</option>
//                                   <option value="Closed">Closed</option>
//                                 </select>
//
//                                 <button
//                                   disabled={t.status === "Escalated"}
//                                   onClick={() => handleEscalate(t.id)}
//                                   className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${
//                                     t.status === "Escalated"
//                                       ? "bg-slate-100 text-slate-400 cursor-not-allowed"
//                                       : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
//                                   }`}
//                                 >
//                                   Escalate
//                                 </button>
//                               </div>
//                             </td>
//                           </motion.tr>
//                         );
//                       })}
//                     </AnimatePresence>
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//
//             {/* GRACEFULLY REPLACED: Hotspot & Emission Intensity replaced with CRMDashboard */}
//             <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs w-full overflow-hidden">
//               {/* CRMDashboard Component Injected Here */}
//               <div className="bg-white w-full">
//                 <CRMDashboard />
//               </div>
//             </div>
//           </div>
//
//           {/* RIGHT COLUMN: Active Escalations & AI Assistant (~4 cols) */}
//           <div className="lg:col-span-4 space-y-6">
//             {/* Escalation Watch */}
//             <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-base font-semibold text-slate-900">
//                   Escalation Watch
//                 </h2>
//                 <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
//                   View Matrix
//                 </span>
//               </div>
//               <p className="text-xs text-slate-500 mb-4">
//                 Automated DPCC tier transitions upon SLA timeout.
//               </p>
//
//               <div className="space-y-3">
//                 <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
//                   <div>
//                     <div className="text-xs font-semibold text-slate-800">
//                       Tier 1 &rarr; Tier 2 (60m limit)
//                     </div>
//                     <p className="text-[11px] text-slate-500 mt-0.5">
//                       Field Inspector to Regional Supervisor
//                     </p>
//                   </div>
//                   <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
//                     Active
//                   </span>
//                 </div>
//
//                 <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
//                   <div>
//                     <div className="text-xs font-semibold text-slate-800">
//                       Tier 2 &rarr; Tier 3 (120m limit)
//                     </div>
//                     <p className="text-[11px] text-slate-500 mt-0.5">
//                       Supervisor to DPCC Divisional Head
//                     </p>
//                   </div>
//                   <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
//                     Standby
//                   </span>
//                 </div>
//               </div>
//             </div>
//
//             {/* AI Complaint Intake Box */}
//             <div className="bg-linear-to-b from-blue-50/50 to-white p-6 rounded-2xl border border-blue-100/80 shadow-sm relative overflow-hidden">
//               <div className="flex items-center gap-2 mb-2">
//                 <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shadow-xs shadow-blue-500/30">
//                   AI
//                 </span>
//                 <h2 className="text-base font-semibold text-slate-900">
//                   AI Complaint Intake & Triage
//                 </h2>
//               </div>
//               <p className="text-xs text-slate-500 mb-4">
//                 Paste raw citizen reports in Hindi/English. The AI reasoning
//                 engine extracts entities, scores priority, and runs
//                 deduplication.
//               </p>
//
//               <form onSubmit={handleComplaintSubmit} className="space-y-3">
//                 <textarea
//                   rows={3}
//                   value={complaintText}
//                   onChange={(e) => setComplaintText(e.target.value)}
//                   placeholder="Enter citizen complaint (e.g., बहुत धुआं आ रहा है factory se)..."
//                   className="w-full text-xs p-3 rounded-sm bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden text-slate-800 placeholder:text-slate-400 resize-none shadow-inset"
//                   required
//                 />
//
//                 {/* Location Area & Channel Row */}
//                 <div className="grid grid-cols-3 gap-2">
//                   <div className="col-span-2">
//                     <input
//                       type="text"
//                       value={area}
//                       onChange={(e) => setArea(e.target.value)}
//                       placeholder="Area (e.g., Anand Vihar)"
//                       className="w-full text-xs h-9 px-3 rounded-sm bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden text-slate-800 placeholder:text-slate-400 shadow-inset"
//                       required
//                     />
//                   </div>
//                   <div className="col-span-1">
//                     <select
//                       value={channel}
//                       onChange={(e) => setChannel(e.target.value)}
//                       className="w-full h-9 px-3 text-xs rounded-sm bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden text-slate-800 shadow-inset font-medium cursor-pointer"
//                     >
//                       <option value="app">app</option>
//                       <option value="web">web</option>
//                       <option value="social">social</option>
//                     </select>
//                   </div>
//                 </div>
//
//                 {/* Coordinates & Photo URL Row (COMPLETED FROM TRUNCATION) */}
//                 <div className="grid grid-cols-4 gap-2">
//                   <div className="col-span-1">
//                     <input
//                       type="text"
//                       value={lat}
//                       onChange={(e) => setLat(e.target.value)}
//                       placeholder="Lat"
//                       className="w-full text-xs h-9 px-2 rounded-sm bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden text-slate-800 placeholder:text-slate-400 shadow-inset"
//                     />
//                   </div>
//                   <div className="col-span-1">
//                     <input
//                       type="text"
//                       value={lng}
//                       onChange={(e) => setLng(e.target.value)}
//                       placeholder="Lng"
//                       className="w-full text-xs h-9 px-2 rounded-sm bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden text-slate-800 placeholder:text-slate-400 shadow-inset"
//                     />
//                   </div>
//                   <div className="col-span-2">
//                     <input
//                       type="url"
//                       value={photoUrl}
//                       onChange={(e) => setPhotoUrl(e.target.value)}
//                       placeholder="Photo URL (Optional)"
//                       className="w-full text-xs h-9 px-3 rounded-sm bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden text-slate-800 placeholder:text-slate-400 shadow-inset"
//                     />
//                   </div>
//                 </div>
//
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-sm shadow-sm transition-colors flex items-center justify-center gap-2"
//                 >
//                   {isSubmitting
//                     ? "Processing AI Triage..."
//                     : "Triage Complaint"}
//                 </button>
//               </form>
//               {/* AI Output Card Display */}
//               <AnimatePresence>
//                 {aiOutput && (
//                   <motion.div
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: 10 }}
//                     className="mt-5 p-4 rounded-xl bg-white border border-blue-200/60 shadow-2xs space-y-3"
//                   >
//                     <div className="flex items-center justify-between border-b border-slate-100 pb-2">
//                       <span className="text-xs font-bold text-slate-900">
//                         AI Triage Result
//                       </span>
//                       <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
//                         {aiOutput.processing_status}
//                       </span>
//                     </div>
//
//                     <div className="grid grid-cols-2 gap-2 text-xs">
//                       <div>
//                         <span className="text-slate-400 text-[11px] block">
//                           Category
//                         </span>
//                         <span className="font-semibold text-slate-800">
//                           {aiOutput.category}
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-slate-400 text-[11px] block">
//                           Priority Score
//                         </span>
//                         <span className="font-semibold text-rose-600">
//                           {aiOutput.priority_score} ({aiOutput.priority_tier})
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-slate-400 text-[11px] block">
//                           Sentiment
//                         </span>
//                         <span className="font-medium text-slate-700 capitalize">
//                           {aiOutput.sentiment_label}
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-slate-400 text-[11px] block">
//                           Deduplication
//                         </span>
//                         <span className="font-medium text-amber-700">
//                           {aiOutput.is_duplicate
//                             ? `Duplicate (${aiOutput.corroboration_count}x)`
//                             : "Unique Ticket"}
//                         </span>
//                       </div>
//                     </div>
//
//                     <div className="pt-2 border-t border-slate-100">
//                       <span className="text-slate-400 text-[11px] block mb-1">
//                         Extracted Entities
//                       </span>
//                       <div className="flex flex-wrap gap-1">
//                         {aiOutput.entities.pollution_source && (
//                           <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
//                             Source: {aiOutput.entities.pollution_source}
//                           </span>
//                         )}
//                         {aiOutput.entities.landmark && (
//                           <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
//                             Near: {aiOutput.entities.landmark}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//
//                     <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
//                       <span className="text-slate-500">
//                         Generated Ticket ID:
//                       </span>
//                       <span className="font-mono font-bold text-blue-600">
//                         {aiOutput.ticket_id || "TICK-NEW-8821"}
//                       </span>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
