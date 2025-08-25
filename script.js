document.addEventListener("DOMContentLoaded", function () {
  const inputTarea = document.getElementById("nueva-tarea");
  const btnAgregar = document.getElementById("agregar-btn");
  const listaTareas = document.getElementById("lista-tareas");
  const listaFavoritos = document.getElementById("lista-favoritos");
  const priorityModal = document.getElementById("priority-modal");
  const priorityOverlay = document.getElementById("priority-overlay");
  const priorityButtons = document.querySelectorAll(".priority-btn");

  let tareas = [];
  let favoritos = [];
  let currentTaskId = null;

  // Cargar tareas y favoritos desde localStorage al iniciar
  cargarDatos();

  // Función para mostrar mensaje de alerta
  function mostrarAlerta(mensaje, tipo = "info") {
    // Eliminar alerta existente si hay una
    const alertaExistente = document.querySelector(
      ".alert-message, .warning-message, .success-message"
    );
    if (alertaExistente) {
      alertaExistente.remove();
    }

    const alerta = document.createElement("div");
    if (tipo === "warning") {
      alerta.className = "warning-message";
    } else if (tipo === "success") {
      alerta.className = "success-message";
    } else {
      alerta.className = "alert-message";
    }

    alerta.innerHTML = `
                    <i class="fas ${
                      tipo === "warning"
                        ? "fa-exclamation-triangle"
                        : tipo === "success"
                        ? "fa-check-circle"
                        : "fa-exclamation-circle"
                    }"></i>
                    <span>${mensaje}</span>
                `;

    document.body.appendChild(alerta);

    // Eliminar la alerta después de 3 segundos
    setTimeout(() => {
      if (alerta.parentNode) {
        alerta.parentNode.removeChild(alerta);
      }
    }, 3000);
  }

  // Función para mostrar el modal de prioridad
  function mostrarModalPrioridad(taskId) {
    currentTaskId = taskId;
    priorityModal.style.display = "flex";
    priorityOverlay.style.display = "block";
  }

  // Función para ocultar el modal de prioridad
  function ocultarModalPrioridad() {
    priorityModal.style.display = "none";
    priorityOverlay.style.display = "none";
    currentTaskId = null;
  }

  // Event listeners para los botones de prioridad
  priorityButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (currentTaskId) {
        const prioridad = this.dataset.priority;
        cambiarPrioridad(currentTaskId, prioridad);
        ocultarModalPrioridad();
        mostrarAlerta(`Prioridad establecida como ${prioridad}`, "success");
      }
    });
  });

  // Event listener para cerrar el modal al hacer clic fuera
  priorityOverlay.addEventListener("click", ocultarModalPrioridad);

  // Función para cambiar la prioridad de una tarea
  function cambiarPrioridad(id, prioridad) {
    tareas = tareas.map((tarea) => {
      if (tarea.id === id) {
        tarea.prioridad = prioridad;
      }
      return tarea;
    });

    localStorage.setItem("tareas", JSON.stringify(tareas));

    // Actualizar la interfaz
    const elemento = document.querySelector(`.tarea[data-id="${id}"]`);
    if (elemento) {
      // Remover clases de prioridad existentes
      elemento.classList.remove("alta-prioridad", "media-prioridad");

      // Añadir la clase correspondiente a la nueva prioridad
      if (prioridad === "alta") {
        elemento.classList.add("alta-prioridad");
      } else if (prioridad === "media") {
        elemento.classList.add("media-prioridad");
      }

      // Actualizar el indicador visual
      const indicator = elemento.querySelector(".priority-indicator");
      if (indicator) {
        indicator.classList.remove("alta", "media", "ninguna");
        indicator.classList.add(prioridad);
      }
    }
  }

  // Función para agregar una nueva tarea
  function agregarTarea() {
    const texto = inputTarea.value.trim();

    if (texto === "") {
      mostrarAlerta("Por favor, escribe una tarea", "warning");
      return;
    }

    // Verificar si ya existe en la lista principal (incluyendo completadas)
    const textoNormalizado = texto.toLowerCase();
    const yaExiste = tareas.some(
      (tarea) => tarea.texto.toLowerCase() === textoNormalizado
    );

    if (yaExiste) {
      mostrarAlerta("Esa tarea ya existe en tu lista", "warning");
      return;
    }

    // Crear elemento de tarea
    const tarea = {
      id: Date.now(),
      texto: texto,
      completada: false,
      favorita: false,
      prioridad: "ninguna", // Prioridad por defecto
    };

    // Guardar en localStorage
    guardarTarea(tarea);

    // Crear elemento en la lista
    crearElementoTarea(tarea);

    // Mostrar mensaje de confirmación
    mostrarAlerta(`"${texto}" agregada correctamente`, "success");

    // Limpiar input
    inputTarea.value = "";
    inputTarea.focus();
  }

  // Event listener para el botón agregar
  btnAgregar.addEventListener("click", agregarTarea);

  // Event listener para la tecla Enter
  inputTarea.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      agregarTarea();
    }
  });

  // Función para crear elemento de tarea en el DOM
  function crearElementoTarea(tarea) {
    const li = document.createElement("li");
    li.classList.add("tarea");
    li.setAttribute("data-id", tarea.id);

    // Aplicar clase de prioridad si existe
    if (tarea.prioridad === "alta") {
      li.classList.add("alta-prioridad");
    } else if (tarea.prioridad === "media") {
      li.classList.add("media-prioridad");
    }

    if (tarea.completada) {
      li.classList.add("completada");
    }

    li.innerHTML = `
                    <div class="priority-indicator ${tarea.prioridad}"></div>
                    <input type="checkbox" class="checkbox-tarea" ${
                      tarea.completada ? "checked" : ""
                    }>
                    <span class="texto-tarea">${tarea.texto}</span>
                    <div class="tarea-actions">
                        <button class="btn-favorito ${
                          tarea.favorita ? "favorito" : ""
                        }">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="btn-eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;

    // Event listener para doble click (cambiar prioridad)
    let clickTimer = null;
    li.addEventListener("dblclick", function (e) {
      // Evitar que se active si se hace clic en elementos interactivos
      if (
        e.target.closest(".checkbox-tarea") ||
        e.target.closest(".btn-favorito") ||
        e.target.closest(".btn-eliminar")
      ) {
        return;
      }

      mostrarModalPrioridad(tarea.id);
    });

    // Event listener para el checkbox
    const checkbox = li.querySelector(".checkbox-tarea");
    checkbox.addEventListener("change", function () {
      toggleCompletada(tarea.id, this.checked);
      li.classList.toggle("completada");

      if (this.checked) {
        mostrarAlerta(`"${tarea.texto}" marcada como completada`, "success");
      }
    });

    // Event listener para el botón favorito
    const btnFavorito = li.querySelector(".btn-favorito");
    btnFavorito.addEventListener("click", function () {
      const esFavorita = !tarea.favorita;

      // Verificar si ya existe en favoritos
      const textoNormalizado = tarea.texto.trim().toLowerCase();
      const yaExiste = favoritos.some(
        (fav) => fav.texto.trim().toLowerCase() === textoNormalizado
      );

      if (esFavorita && yaExiste) {
        mostrarAlerta("Esta tarea ya está entre las favoritas", "warning");
        return;
      }

      toggleFavorita(tarea.id, esFavorita);
      btnFavorito.classList.toggle("favorito", esFavorita);

      if (esFavorita) {
        mostrarAlerta(`"${tarea.texto}" agregada a favoritos`, "success");
      } else {
        mostrarAlerta(`"${tarea.texto}" eliminada de favoritos`);
      }

      cargarFavoritos();
    });

    // Event listener para el botón eliminar
    const btnEliminar = li.querySelector(".btn-eliminar");
    btnEliminar.addEventListener("click", function (e) {
      e.stopPropagation();

      if (
        confirm(
          `¿Estás seguro de que quieres eliminar la tarea "${tarea.texto}"?`
        )
      ) {
        // No eliminamos la tarea de favoritos al borrarla de la lista principal
        eliminarTarea(tarea.id);
        li.remove();
        verificarListaVacia();
        mostrarAlerta(`"${tarea.texto}" eliminada correctamente`);
      }
    });

    listaTareas.appendChild(li);
    verificarListaVacia();
  }

  // Función para agregar tarea desde favoritos
  function agregarDesdeFavoritos(textoTarea, id) {
    // Verificar si ya existe en la lista principal (solo tareas no completadas)
    const textoNormalizado = textoTarea.toLowerCase();
    const yaExiste = tareas.some(
      (tarea) =>
        tarea.texto.toLowerCase() === textoNormalizado && !tarea.completada
    );

    if (yaExiste) {
      mostrarAlerta("Esa tarea ya existe en tu lista", "warning");
      return;
    }

    // Crear elemento de tarea
    const tarea = {
      id: Date.now(),
      texto: textoTarea,
      completada: false,
      favorita: false,
      prioridad: "ninguna",
    };

    // Guardar en localStorage
    guardarTarea(tarea);

    // Crear elemento en la lista
    crearElementoTarea(tarea);

    // Mostrar mensaje de confirmación
    mostrarAlerta(`"${textoTarea}" agregada desde favoritos`, "success");
  }

  // Función para ordenar favoritos alfabéticamente
  function ordenarFavoritos() {
    favoritos.sort((a, b) => {
      const textoA = a.texto.toLowerCase();
      const textoB = b.texto.toLowerCase();

      if (textoA < textoB) return -1;
      if (textoA > textoB) return 1;
      return 0;
    });

    // Guardar el orden en localStorage
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }

  // Función para cargar favoritos
  function cargarFavoritos() {
    // Ordenar favoritos alfabéticamente
    ordenarFavoritos();

    listaFavoritos.innerHTML = "";

    if (favoritos.length === 0) {
      const mensaje = document.createElement("li");
      mensaje.classList.add("vacio");
      mensaje.textContent = "No hay tareas favoritas";
      listaFavoritos.appendChild(mensaje);
      return;
    }

    favoritos.forEach((tarea) => {
      const li = document.createElement("li");
      li.classList.add("favorite-item");
      li.innerHTML = `
                        <span>${tarea.texto}</span>
                        <div>
                            <button class="btn-eliminar-favorito">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;

      // Event listener para agregar automáticamente al hacer clic en la tarea
      li.addEventListener("click", function (e) {
        // Evitar que se active si se hace clic en el botón de eliminar
        if (!e.target.closest(".btn-eliminar-favorito")) {
          agregarDesdeFavoritos(tarea.texto, tarea.id);
        }
      });

      // Event listener para eliminar de favoritos
      const btnEliminar = li.querySelector(".btn-eliminar-favorito");
      btnEliminar.addEventListener("click", function (e) {
        e.stopPropagation();

        if (confirm(`¿Eliminar "${tarea.texto}" de favoritos?`)) {
          eliminarFavorito(tarea.id);
          mostrarAlerta(`"${tarea.texto}" eliminada de favoritos`);
        }
      });

      listaFavoritos.appendChild(li);
    });
  }

  // Función para guardar tarea en localStorage
  function guardarTarea(tarea) {
    tareas.push(tarea);
    localStorage.setItem("tareas", JSON.stringify(tareas));
  }

  // Función para cargar datos al iniciar
  function cargarDatos() {
    // Cargar tareas
    const tareasData = localStorage.getItem("tareas");
    tareas = tareasData ? JSON.parse(tareasData) : [];

    // Cargar favoritos
    const favoritosData = localStorage.getItem("favoritos");
    favoritos = favoritosData ? JSON.parse(favoritosData) : [];

    if (tareas.length === 0) {
      mostrarMensajeVacio();
    } else {
      tareas.forEach((tarea) => {
        crearElementoTarea(tarea);
      });
    }

    cargarFavoritos();
  }

  // Función para cambiar estado de completada
  function toggleCompletada(id, completada) {
    tareas = tareas.map((tarea) => {
      if (tarea.id === id) {
        tarea.completada = completada;
      }
      return tarea;
    });

    localStorage.setItem("tareas", JSON.stringify(tareas));
  }

  // Función para cambiar estado de favorita
  function toggleFavorita(id, esFavorita) {
    tareas = tareas.map((tarea) => {
      if (tarea.id === id) {
        tarea.favorita = esFavorita;

        // Agregar o quitar de favoritos
        if (esFavorita) {
          // Verificar si ya existe en favoritos
          const existeEnFavoritos = favoritos.some((fav) => fav.id === id);
          if (!existeEnFavoritos) {
            // Crear una copia para evitar referencia al objeto original
            const tareaFavorita = { ...tarea };
            favoritos.push(tareaFavorita);
          }
        } else {
          // Eliminar de favoritos
          favoritos = favoritos.filter((fav) => fav.id !== id);
        }
      }
      return tarea;
    });

    localStorage.setItem("tareas", JSON.stringify(tareas));
    localStorage.setItem("favoritos", JSON.stringify(favoritos));

    // Recargar favoritos para mantener el orden alfabético
    cargarFavoritos();
  }

  // Función para eliminar tarea de la lista principal
  function eliminarTarea(id) {
    // No eliminamos la tarea de favoritos al borrarla de la lista principal
    tareas = tareas.filter((tarea) => tarea.id !== id);
    localStorage.setItem("tareas", JSON.stringify(tareas));
  }

  // Función para eliminar tarea de favoritos
  function eliminarFavorito(id) {
    favoritos = favoritos.filter((tarea) => tarea.id !== id);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));

    // Actualizar estado en la lista principal si la tarea todavía existe
    tareas = tareas.map((tarea) => {
      if (tarea.id === id) {
        tarea.favorita = false;
      }
      return tarea;
    });
    localStorage.setItem("tareas", JSON.stringify(tareas));

    // Recargar favoritos
    cargarFavoritos();

    // Actualizar UI de la lista principal
    const elementoFavorito = document.querySelector(
      `.tarea[data-id="${id}"] .btn-favorito`
    );
    if (elementoFavorito) {
      elementoFavorito.classList.remove("favorito");
    }
  }

  // Función para verificar si la lista está vacía
  function verificarListaVacia() {
    const tareasIncompletas = tareas.filter((tarea) => !tarea.completada);

    if (tareasIncompletas.length === 0) {
      mostrarMensajeVacio("No hay tareas pendientes. ¡Agrega una!");
    } else {
      const mensajeVacio = document.getElementById("mensaje-vacio");
      if (mensajeVacio) {
        mensajeVacio.remove();
      }
    }
  }

  // Función para mostrar mensaje de lista vacía
  function mostrarMensajeVacio(mensaje) {
    if (document.getElementById("mensaje-vacio")) return;

    const li = document.createElement("li");
    li.classList.add("vacio");
    li.textContent = mensaje;
    li.id = "mensaje-vacio";
    listaTareas.appendChild(li);
  }
});
