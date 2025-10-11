; Base de conocimiento MeTTa - Ejemplo simple

; Definir reglas de razonamiento
(: reason (-> String Expression))

; Definir algunos hechos básicos
(: human (-> Symbol Bool))
(human socrates)
(human plato)
(human aristotle)

(: mortal (-> Symbol Bool))

; Regla: Todos los humanos son mortales
(= (mortal $x)
   (human $x))

; Regla de razonamiento simple
(= (reason "who is mortal")
   (mortal socrates))

(= (reason "is socrates mortal")
   (if (mortal socrates) "Yes, Socrates is mortal" "No"))

; Ejemplos de razonamiento sobre animales
(: animal (-> Symbol Bool))
(animal cat)
(animal dog)
(animal bird)

(: can-fly (-> Symbol Bool))
(can-fly bird)

(= (reason "what can fly")
   (can-fly bird))

; Regla de razonamiento genérica para animales que vuelan
(= (reason $query)
   (case $query
     (("can bird fly") (can-fly bird))
     (("list animals") (animal cat))
     ($_ "Unknown query")))
