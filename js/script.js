// Seleção dos elementos do DOM
const input = document.getElementById("inputTask");
const addBtn = document.getElementById("addBtn");
const prioritySelect = document.getElementById("prioritySelect");
const taskSection = document.querySelector(".taskSection");
const clock = document.getElementById("clock");

// Modais e botões de confirmação
const confirmModal = document.getElementById("confirmModal");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");

const editConfirmModal = document.getElementById("editConfirmModal");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let taskItemToComplete = null;
let taskItemToEdit = null;

// ======================= Funções principais =======================

async function addTask() {
    const inputValue = input.value.trim();
    const priorityValue = prioritySelect.value;

    if (inputValue !== "") {
        try {
        const response = await fetch("http://localhost:3000/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: inputValue, priority: priorityValue })
        });

        const newTask = await response.json();
        appendTaskToDOM(newTask);
        resetInputFields();
        } catch (err) {
        console.error("Erro ao adicionar tarefa:", err);
        }
    }
}

function resetInputFields() {
    input.value = "";
    prioritySelect.value = "low";
}

function createButton(text, className) {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add(className);
    return button;
}

function appendTaskToDOM(task) {
    const taskItem = document.createElement("div");
    taskItem.classList.add("task-item", task.priority || "low");
    if (task.done) taskItem.classList.add("completed");
    taskItem.dataset.id = task._id;

    const taskText = document.createElement("span");
    taskText.textContent = task.text;

    const completeBtn = createButton(task.done ? "Completo" : "Completar", "complete-btn");
    completeBtn.disabled = task.done;

    const editBtn = createButton("Editar", "edit-btn");
    editBtn.disabled = task.done;

    const removeBtn = createButton("Remover", "remove-btn");

    // Eventos
    completeBtn.addEventListener("click", () => {
        taskItemToComplete = taskItem;
        confirmModal.style.display = "flex";
    });

    editBtn.addEventListener("click", () => handleEditTask(taskItem, taskText, editBtn));

    removeBtn.addEventListener("click", () => deleteTask(task._id, taskItem));

    taskItem.append(taskText, completeBtn, editBtn, removeBtn);
    taskSection.appendChild(taskItem);
}

async function deleteTask(id, taskItem) {
    try {
        await fetch(`http://localhost:3000/tasks/${id}`, { method: "DELETE" });
        taskItem.classList.add("removed");
        setTimeout(() => taskItem.remove(), 500);
    } catch (err) {
        console.error("Erro ao deletar tarefa:", err);
    }
    }

    function handleEditTask(taskItem, taskText, editBtn) {
    if (taskItem.classList.contains("completed")) {
        alert("Não é possível editar uma tarefa completa.");
        return;
    }

    if (taskText.contentEditable === "true") {
        taskItemToEdit = taskItem;
        editConfirmModal.style.display = "flex";
    } else {
        taskText.contentEditable = true;
        taskText.focus();
        editBtn.textContent = "Salvar";
    }
}

saveEditBtn.addEventListener("click", async () => {
    if (taskItemToEdit) {
        const span = taskItemToEdit.querySelector("span");
        const newText = span.textContent.trim();
        const taskId = taskItemToEdit.dataset.id;

        try {
        await fetch(`http://localhost:3000/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newText })
        });
        } catch (err) {
        console.error("Erro ao salvar edição:", err);
        }

        span.contentEditable = false;
        taskItemToEdit.querySelector(".edit-btn").textContent = "Editar";
    }
    closeModal(editConfirmModal);
});

confirmBtn.addEventListener("click", async () => {
    if (taskItemToComplete) {
        const taskId = taskItemToComplete.dataset.id;

        try {
        await fetch(`http://localhost:3000/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done: true })
        });
        } catch (err) {
        console.error("Erro ao completar tarefa:", err);
    }   

    taskItemToComplete.classList.add("completed");
    const completeBtn = taskItemToComplete.querySelector(".complete-btn");
    completeBtn.textContent = "Completo";
    completeBtn.disabled = true;
    taskItemToComplete.querySelector(".edit-btn").disabled = true;
    }
    closeModal(confirmModal);
});

cancelBtn.addEventListener("click", () => closeModal(confirmModal));

cancelEditBtn.addEventListener("click", () => {
    if (taskItemToEdit) {
        const span = taskItemToEdit.querySelector("span");
        span.contentEditable = false;
        taskItemToEdit.querySelector(".edit-btn").textContent = "Editar";
    }
    closeModal(editConfirmModal);
});

function closeModal(modal) {
    modal.style.display = "none";
    taskItemToComplete = null;
    taskItemToEdit = null;
}

// Relógio
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    clock.textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateClock, 1000);
updateClock();

// Carrega tarefas do back-end
async function loadTasksFromAPI() {
    try {
        const response = await fetch("http://localhost:3000/tasks");
        const tasks = await response.json();
        taskSection.innerHTML = ""; // limpa antes de recarregar
        tasks.forEach(task => appendTaskToDOM(task));
    } catch (err) {
        console.log("Erro ao carregar tarefas:", err);
    }
}

addBtn.addEventListener("click", addTask);

window.onload = () => {
    closeModal(confirmModal);
    closeModal(editConfirmModal);
    loadTasksFromAPI();
};
