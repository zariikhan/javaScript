class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.initializeTheme();
    }

    initializeElements() {
        this.todoForm = document.getElementById('todoForm');
        this.todoInput = document.getElementById('todoInput');
        this.todosList = document.getElementById('todosList');
        this.todosCount = document.getElementById('todosCount');
        this.emptyState = document.getElementById('emptyState');
        this.searchInput = document.getElementById('searchInput');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.themeToggle = document.getElementById('themeToggle');
    }

    bindEvents() {
        // Form submission
        this.todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });

        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => {
            this.clearCompleted();
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editingId) {
                this.cancelEdit();
            }
        });
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.todoInput.value = '';
        this.saveTodos();
        this.render();
        
        // Focus back to input for continuous adding
        this.todoInput.focus();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    deleteTodo(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            todoElement.classList.add('removing');
            setTimeout(() => {
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveTodos();
                this.render();
            }, 300);
        }
    }

    startEdit(id) {
        this.editingId = id;
        this.render();
        
        // Focus the edit input
        setTimeout(() => {
            const editInput = document.querySelector('.edit-input');
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 0);
    }

    saveEdit(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.editingId = null;
            this.saveTodos();
            this.render();
        } else if (!newText.trim()) {
            this.deleteTodo(id);
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    clearCompleted() {
        this.todos = this.todos.filter(todo => !todo.completed);
        this.saveTodos();
        this.render();
    }

    getFilteredTodos() {
        let filtered = this.todos;

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply status filter
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(todo => !todo.completed);
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.completed);
                break;
            default:
                // 'all' - no additional filtering
                break;
        }

        return filtered;
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        // Update todos count
        const activeCount = this.todos.filter(todo => !todo.completed).length;
        const totalCount = this.todos.length;
        this.todosCount.textContent = `${activeCount} of ${totalCount} tasks`;

        // Update clear completed button
        const completedCount = this.todos.filter(todo => todo.completed).length;
        this.clearCompletedBtn.disabled = completedCount === 0;

        // Show/hide empty state
        if (filteredTodos.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.todosList.innerHTML = '';
            
            // Update empty state message based on current state
            const emptyIcon = this.emptyState.querySelector('i');
            const emptyTitle = this.emptyState.querySelector('h3');
            const emptyText = this.emptyState.querySelector('p');
            
            if (this.searchQuery) {
                emptyIcon.className = 'fas fa-search';
                emptyTitle.textContent = 'No matching tasks';
                emptyText.textContent = 'Try adjusting your search terms.';
            } else if (this.currentFilter === 'completed' && completedCount === 0) {
                emptyIcon.className = 'fas fa-check-circle';
                emptyTitle.textContent = 'No completed tasks';
                emptyText.textContent = 'Complete some tasks to see them here.';
            } else if (this.currentFilter === 'active' && activeCount === 0) {
                emptyIcon.className = 'fas fa-trophy';
                emptyTitle.textContent = 'All done!';
                emptyText.textContent = 'Great job completing all your tasks!';
            } else {
                emptyIcon.className = 'fas fa-clipboard-list';
                emptyTitle.textContent = 'No tasks yet';
                emptyText.textContent = 'Add a task above to get started!';
            }
        } else {
            this.emptyState.classList.add('hidden');
            this.renderTodos(filteredTodos);
        }
    }

    renderTodos(todos) {
        this.todosList.innerHTML = todos.map(todo => {
            const isEditing = this.editingId === todo.id;
            
            return `
                <li class="todo-item ${todo.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}" data-id="${todo.id}">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="app.toggleTodo('${todo.id}')">
                        ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    
                    ${isEditing ? `
                        <input 
                            type="text" 
                            class="edit-input" 
                            value="${this.escapeHtml(todo.text)}"
                            onblur="app.handleEditBlur('${todo.id}', this.value)"
                            onkeydown="app.handleEditKeydown(event, '${todo.id}', this.value)"
                        >
                    ` : ''}
                    
                    <div class="todo-actions">
                        <button class="todo-btn edit-btn" onclick="app.startEdit('${todo.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="todo-btn delete-btn" onclick="app.deleteTodo('${todo.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('');
    }

    handleEditBlur(id, value) {
        if (this.editingId === id) {
            this.saveEdit(id, value);
        }
    }

    handleEditKeydown(event, id, value) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.saveEdit(id, value);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.cancelEdit();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Theme management
    initializeTheme() {
        const savedTheme = localStorage.getItem('todoApp_theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = this.themeToggle.querySelector('i');
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
        
        localStorage.setItem('todoApp_theme', theme);
    }

    // Local storage management
    loadTodos() {
        try {
            const stored = localStorage.getItem('todoApp_todos');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading todos:', error);
            return [];
        }
    }

    saveTodos() {
        try {
            localStorage.setItem('todoApp_todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving todos:', error);
        }
    }

    // Public API for demo data
    addSampleTodos() {
        const sampleTodos = [
            { text: 'Welcome to TaskFlow! 🎉', completed: false },
            { text: 'Try editing this task by clicking the edit button', completed: false },
            { text: 'Mark this task as complete', completed: false },
            { text: 'Use the search to find specific tasks', completed: false },
            { text: 'This task is already completed', completed: true },
            { text: 'Try the different filter options', completed: false },
            { text: 'Toggle between light and dark themes', completed: false }
        ];

        sampleTodos.forEach((todo, index) => {
            this.todos.push({
                id: (Date.now() + index).toString(),
                text: todo.text,
                completed: todo.completed,
                createdAt: new Date().toISOString()
            });
        });

        this.saveTodos();
        this.render();
    }

    // Utility methods for external access
    exportTodos() {
        return JSON.stringify(this.todos, null, 2);
    }

    importTodos(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.todos = imported;
                this.saveTodos();
                this.render();
                return true;
            }
        } catch (error) {
            console.error('Error importing todos:', error);
        }
        return false;
    }

    clearAllTodos() {
        if (confirm('Are you sure you want to delete all todos? This cannot be undone.')) {
            this.todos = [];
            this.saveTodos();
            this.render();
        }
    }
}

// Initialize the app
const app = new TodoApp();

// Add some helpful console methods for development
console.log('🎉 TaskFlow Todo App loaded!');
console.log('Try these commands in the console:');
console.log('• app.addSampleTodos() - Add sample todos');
console.log('• app.exportTodos() - Export your todos as JSON');
console.log('• app.importTodos(jsonString) - Import todos from JSON');
console.log('• app.clearAllTodos() - Clear all todos');

// Auto-add sample todos if no todos exist
if (app.todos.length === 0) {
    setTimeout(() => {
        app.addSampleTodos();
    }, 1000);
}