export const defaultWeddingScenes = [
  // Preparativos Novia
  { name: "Preparativos Novia", division: "INTRODUCCION", description: "Mastershoot", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Preparativos Novia", division: "NUCLEO", description: "Retoque maquillaje y peinado", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Preparativos Novia", division: "NUCLEO", description: "Colocación de vestido y accesorios", planned_duration: 90, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Preparativos Novia", division: "NUCLEO", description: "Sesión de batas con damas", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Preparativos Novia", division: "RESOLUCION", description: "Fotos sola y con familia", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  
  // Preparativos Novio
  { name: "Preparativos Novio", division: "INTRODUCCION", description: "Mastershoot", planned_duration: 20, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Preparativos Novio", division: "NUCLEO", description: "Colocación de traje y accesorios", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Preparativos Novio", division: "NUCLEO", description: "Brindis", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Preparativos Novio", division: "RESOLUCION", description: "Fotos solo, con amigos y familia", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // First Look
  { name: "First Look", division: "INTRODUCCION", description: "Espera del novio", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "First Look", division: "NUCLEO", description: "First look papá", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "First Look", division: "NUCLEO", description: "First look novio", planned_duration: 90, is_anchor_moment: "SI", anchor_description: "First Look (novio)", priority: "must-have" },
  { name: "First Look", division: "RESOLUCION", description: "Primeras palabras y abrazo", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  
  // Sesión Novios
  { name: "Sesión Novios", division: "NUCLEO", description: "Interacción guiada", planned_duration: 120, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Sesión Novios", division: "NUCLEO", description: "Interacción espontánea", planned_duration: 90, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Sesión Familia
  { name: "Sesión Familia", division: "NUCLEO", description: "Familia novia", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Sesión Familia", division: "NUCLEO", description: "Familia novio", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Sesión Familia", division: "NUCLEO", description: "Familias juntas", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Sesión Damas
  { name: "Sesión Damas", division: "NUCLEO", description: "Interacción guiada", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Sesión Damas", division: "NUCLEO", description: "Interacción espontánea", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Sesión Caballeros
  { name: "Sesión Caballeros", division: "NUCLEO", description: "Interacción guiada", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Sesión Caballeros", division: "NUCLEO", description: "Interacción espontánea", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Ceremonia Civil
  { name: "Ceremonia Civil", division: "INTRODUCCION", description: "Entrada e inicio de ceremonia", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Ceremonia Civil", division: "NUCLEO", description: "Lectura y votos legales", planned_duration: 60, is_anchor_moment: "SI", anchor_description: "\"Sí, acepto\" (civil)", priority: "must-have" },
  { name: "Ceremonia Civil", division: "NUCLEO", description: "Primer beso como casados", planned_duration: 15, is_anchor_moment: "SI", anchor_description: "Primer beso", priority: "must-have" },
  { name: "Ceremonia Civil", division: "RESOLUCION", description: "Salida y felicitaciones", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  
  // Ceremonia Religiosa
  { name: "Ceremonia Religiosa", division: "INTRODUCCION", description: "Cortejo", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Ceremonia Religiosa", division: "INTRODUCCION", description: "Entrada de la novia", planned_duration: 90, is_anchor_moment: "SI", anchor_description: "Entrada de la novia", priority: "must-have" },
  { name: "Ceremonia Religiosa", division: "NUCLEO", description: "Lecturas", planned_duration: 90, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Ceremonia Religiosa", division: "NUCLEO", description: "Sermón del padre", planned_duration: 120, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Ceremonia Religiosa", division: "NUCLEO", description: "Promesas matrimoniales", planned_duration: 60, is_anchor_moment: "SI", anchor_description: "Yo, te acepto a ti, como mi esposo...", priority: "must-have" },
  { name: "Ceremonia Religiosa", division: "NUCLEO", description: "Intercambio de anillos", planned_duration: 45, is_anchor_moment: "SI", anchor_description: "Entrega de anillos (ceremonia religiosa)", priority: "must-have" },
  { name: "Ceremonia Religiosa", division: "NUCLEO", description: "Rito: arras, velación, lazo, ramo a la virgen", planned_duration: 90, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Ceremonia Religiosa", division: "NUCLEO", description: "Saludo de paz", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Ceremonia Religiosa", division: "NUCLEO", description: "Primer beso como casados", planned_duration: 20, is_anchor_moment: "SI", anchor_description: "Primer beso", priority: "must-have" },
  { name: "Ceremonia Religiosa", division: "RESOLUCION", description: "Salida entre aplausos", planned_duration: 60, is_anchor_moment: "SI", anchor_description: "Salida de ceremonia", priority: "must-have" },
  
  // Cóctel
  { name: "Cóctel", division: "INTRODUCCION", description: "Llegada de invitados", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Cóctel", division: "NUCLEO", description: "Felicitaciones a los recién casados", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Cóctel", division: "NUCLEO", description: "Convivencia, canapés y bebidas", planned_duration: 240, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Cóctel", division: "RESOLUCION", description: "Invitación a pasar al salón", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Entrada Novios
  { name: "Entrada Novios", division: "INTRODUCCION", description: "Expectativa y música", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Entrada Novios", division: "NUCLEO", description: "Gran entrada de los novios", planned_duration: 60, is_anchor_moment: "SI", anchor_description: "Entrada de novios", priority: "must-have" },
  { name: "Entrada Novios", division: "RESOLUCION", description: "Llegada a la mesa principal", planned_duration: 20, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Banquete
  { name: "Banquete", division: "INTRODUCCION", description: "Mastershoot", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Banquete", division: "NUCLEO", description: "Servicio y convivencia", planned_duration: 600, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Banquete", division: "RESOLUCION", description: "Gente de pie", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Brindis
  { name: "Brindis", division: "NUCLEO", description: "Discurso emocional", planned_duration: 120, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Brindis", division: "NUCLEO", description: "Brindis", planned_duration: 45, is_anchor_moment: "SI", anchor_description: "Brindis clave", priority: "must-have" },
  
  // Bailes
  { name: "Bailes", division: "INTRODUCCION", description: "Preparando la pista de baile", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Bailes", division: "NUCLEO", description: "Baile novia y papá", planned_duration: 180, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Bailes", division: "NUCLEO", description: "Baile novio y mamá", planned_duration: 180, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  { name: "Bailes", division: "NUCLEO", description: "Baile de esposos", planned_duration: 240, is_anchor_moment: "SI", anchor_description: "Primer baile", priority: "must-have" },
  { name: "Bailes", division: "RESOLUCION", description: "Apertura de pista", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "must-have" },
  
  // Fiesta
  { name: "Fiesta", division: "INTRODUCCION", description: "Mastershoot", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Fiesta", division: "NUCLEO", description: "Baile, risas, tragos", planned_duration: 400, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Fiesta", division: "NUCLEO", description: "Happenings", planned_duration: 200, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Ramo
  { name: "Ramo", division: "INTRODUCCION", description: "Solteras al frente", planned_duration: 20, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Ramo", division: "NUCLEO", description: "Lanzamiento del ramo", planned_duration: 45, is_anchor_moment: "SI", anchor_description: "Lanzamiento de ramo", priority: "nice-to-have" },
  { name: "Ramo", division: "RESOLUCION", description: "Celebración de quien lo atrapó", planned_duration: 20, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  
  // Liga
  { name: "Liga", division: "INTRODUCCION", description: "Baile del novio", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Liga", division: "NUCLEO", description: "Solteros al frente", planned_duration: 20, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" },
  { name: "Liga", division: "NUCLEO", description: "Lanzamiento de la liga", planned_duration: 45, is_anchor_moment: "SI", anchor_description: "Lanzamiento de liga", priority: "nice-to-have" },
  { name: "Liga", division: "RESOLUCION", description: "Celebración de quien la atrapó", planned_duration: 20, is_anchor_moment: "NO", anchor_description: "", priority: "nice-to-have" }
];
