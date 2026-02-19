#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xacthbehposxdrfqajwz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY3RoYmVocG9zeGRyZnFhand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzY5MjAsImV4cCI6MjA4NTUxMjkyMH0.GNYBVoVzkHsB8lANCCuihURppO5oCI36WwVrc5YeQU0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const task = {
  title: "Investigación: Alex Finn - CloudBot/OpenCloud en YouTube",
  description: "Scrapear todo el canal de Alex Finn en YouTube. Buscar y revisar todos los vídeos sobre CloudBot y OpenCloud. Generar resumen completo con: aprendizajes clave, lecciones, consejos y mejores prácticas que menciona sobre CloudBot/OpenCloud.",
  status: "todo",
  assignee: "Roberto",
  priority: "high",
  labels: ["research", "youtube", "cloudbot", "openclaw"],
  due_date: new Date("2026-02-10T06:00:00Z").toISOString(),
  notes: "Ejecutar esta noche. Incluir: resumen ejecutivo, aprendizajes, lecciones, consejos, mejores prácticas."
};

async function registerTask() {
  try {
    console.log("📝 Registrando tarea en Supabase...");
    
    const { data, error } = await supabase
      .from("tasks")
      .insert([task])
      .select();

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log("✅ Tarea registrada en Supabase:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

registerTask();
