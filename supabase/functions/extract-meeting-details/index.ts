import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transcript, action } = await req.json();

    // Action: list bookings
    if (action === "list") {
      const { data, error } = await supabase
        .from("meeting_bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("meeting_date", { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ bookings: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: assign script to a meeting
    if (action === "assign_script") {
      const { booking_id, script_content } = await req.json().catch(() => ({ booking_id: null, script_content: null }));
      // Re-parse since we already consumed the body — use the parsed values from above
    }

    // Default action: extract meeting details from transcript using AI
    if (!transcript || transcript.length === 0) {
      return new Response(JSON.stringify({ error: "No transcript provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const transcriptText = transcript
      .map((l: { speaker: string; text: string }) => `${l.speaker}: ${l.text}`)
      .join("\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a meeting details extractor. Given a voice call transcript, extract structured meeting/booking information. Today's date is ${new Date().toISOString().split("T")[0]}.`,
          },
          {
            role: "user",
            content: `Extract meeting details from this call transcript:\n\n${transcriptText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_meeting",
              description: "Save extracted meeting booking details",
              parameters: {
                type: "object",
                properties: {
                  caller_name: { type: "string", description: "Name of the caller/attendee" },
                  meeting_title: { type: "string", description: "Title or purpose of the meeting" },
                  meeting_date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  meeting_time: { type: "string", description: "Time in HH:MM format (24h)" },
                  duration_minutes: { type: "number", description: "Duration in minutes" },
                  call_platform: { type: "string", enum: ["phone", "google_meet", "teams", "zoom", "other"], description: "Platform for the call: phone, google_meet, teams, zoom, or other" },
                  meeting_link: { type: "string", description: "Meeting URL or phone number if provided" },
                  notes: { type: "string", description: "Key notes, preferences, or details from the call" },
                  transcript_summary: { type: "string", description: "Brief summary of the conversation" },
                },
                required: ["caller_name", "meeting_title", "meeting_date", "meeting_time"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_meeting" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI extraction failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Could not extract meeting details" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meeting = JSON.parse(toolCall.function.arguments);
    console.log("Extracted meeting:", meeting);

    // Save to database
    const { data: booking, error: insertError } = await supabase
      .from("meeting_bookings")
      .insert({
        user_id: user.id,
        caller_name: meeting.caller_name || "Unknown Caller",
        meeting_title: meeting.meeting_title || "Meeting",
        meeting_date: meeting.meeting_date,
        meeting_time: meeting.meeting_time || "09:00",
        duration_minutes: meeting.duration_minutes || 30,
        call_platform: meeting.call_platform || "phone",
        meeting_link: meeting.meeting_link || null,
        notes: meeting.notes || null,
        transcript_summary: meeting.transcript_summary || null,
        status: "scheduled",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ booking, extracted: meeting }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-meeting-details error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
