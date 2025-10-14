#!/usr/bin/env python3
"""
Test script que simula lo que hace el agente:
1. Obtiene la lista de proyectos desde Next.js
2. Busca documentación sobre Chainlink VRF
3. Genera razonamiento simbólico con MeTTa
"""

import requests
from hyperon import MeTTa

NEXT_API_BASE = "http://localhost:3000/api"
PROJECTS_URL = f"{NEXT_API_BASE}/projects"
DOCS_SEARCH_URL = f"{NEXT_API_BASE}/docs"

def text_to_metta_facts(chunks):
    facts = []
    for idx, chunk in enumerate(chunks):
        content = chunk.get("content", "")
        snippet = content.replace("\n", " ").replace('"', "'")[:400]
        facts.append(f'!(doc chunk-{idx} "{snippet}")')
    return "\n".join(facts)

def metta_reasoning(query, chunks):
    metta = MeTTa()
    base_facts = text_to_metta_facts(chunks)
    reasoning_template = f"""
    (bind $q "{query}")

    ; Agregamos hechos
    {base_facts}

    ; Buscamos relaciones y dependencias simbólicas
    (match &self
        (doc $id $content)
        (if (and (find $content "import") (find $content "deploy"))
            (print "This section likely involves both import and deployment steps"))
        (if (find $content "API")
            (print "This section mentions API integration"))
        (if (find $content "contract")
            (print "This section involves smart contracts"))
    )
    """
    result = metta.run(reasoning_template)
    return "\n".join([str(r) for r in result])

def main():
    query = "How do I use Chainlink VRF?"

    print("=" * 60)
    print(f"🔎 Query: {query}")
    print("=" * 60)

    # Step 1: Get projects
    print("\n📚 Step 1: Obteniendo proyectos...")
    try:
        response = requests.get(PROJECTS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()

        # El endpoint devuelve {"projects": [...], "count": N}
        if isinstance(data, dict) and "projects" in data:
            projects = data["projects"]
        else:
            projects = []

        if not projects:
            print("❌ No hay proyectos indexados.")
            print("   Por favor, sube el archivo vrf.md desde http://localhost:3000")
            return

        print(f"✅ {len(projects)} proyecto(s) encontrado(s):")
        for p in projects:
            print(f"   - {p['name']} (ID: {p['id']})")

    except Exception as e:
        print(f"❌ Error al obtener proyectos: {e}")
        import traceback
        traceback.print_exc()
        return

    # Step 2: Search in each project
    print(f"\n🔍 Step 2: Buscando '{query}' en los proyectos...")
    all_chunks = []

    for project in projects:
        project_id = project.get("id")
        project_name = project.get("name", "Unknown")

        try:
            response = requests.get(
                DOCS_SEARCH_URL,
                params={"projectId": project_id, "searchText": query},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if data and "results" in data and data["results"]:
                for chunk in data["results"]:
                    chunk["project_name"] = project_name
                all_chunks.extend(data["results"])
                print(f"   ✅ {len(data['results'])} resultados de '{project_name}'")
        except Exception as e:
            print(f"   ⚠️ Error en proyecto '{project_name}': {e}")
            continue

    if not all_chunks:
        print(f"\n❌ No se encontró información sobre '{query}'")
        return

    # Step 3: Sort and get top results
    print(f"\n📊 Step 3: Ordenando por relevancia...")
    all_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
    top_chunks = all_chunks[:5]
    print(f"   ✅ Top {len(top_chunks)} resultados más relevantes")

    # Step 4: Generate MeTTa reasoning
    print(f"\n🧠 Step 4: Generando razonamiento simbólico con MeTTa...")
    try:
        reasoning = metta_reasoning(query, top_chunks)
        print(f"   ✅ Razonamiento generado")
    except Exception as e:
        print(f"   ⚠️ Error en razonamiento: {e}")
        reasoning = "(razonamiento no disponible)"

    # Step 5: Format and display response
    print(f"\n{'=' * 60}")
    print("🤖 RESPUESTA FINAL")
    print("=" * 60)

    print(f"\n📚 Basado en la documentación, encontré lo siguiente:\n")
    for i, chunk in enumerate(top_chunks[:3], 1):
        project = chunk.get('project_name', 'Unknown')
        content = chunk['content'][:150].replace('\n', ' ')
        score = chunk.get('score', 0)
        print(f"{i}. [{project}] (Score: {score:.4f})")
        print(f"   {content}...\n")

    print(f"\n🧠 Razonamiento estructurado:")
    print(reasoning if reasoning else "(Sin razonamiento)")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
