console.log('AI T19 Complete Team Management System - Modern Version');

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBX4s8BSIYPlLfFSAu3KFT5u8tmHWA5cxo",
    authDomain: "team-management-app-63275.firebaseapp.com",
    databaseURL: "https://team-management-app-63275-default-rtdb.firebaseio.com",
    projectId: "team-management-app-63275",
    storageBucket: "team-management-app-63275.firebasestorage.app",
    messagingSenderId: "513377063529",
    appId: "1:513377063529:web:5fce8f99b6b48a816288f8"
};

// Performance Manager
class PerformanceManager {
    constructor() {
        this.buttonStates = new Map();
        this.debounceTimers = new Map();
    }

    isButtonBusy(buttonId) {
        return this.buttonStates.get(buttonId) === 'busy';
    }

    setBusy(buttonId, isBusy) {
        this.buttonStates.set(buttonId, isBusy ? 'busy' : 'ready');
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = isBusy;
            if (isBusy) {
                button.classList.add('loading');
                const originalHtml = button.innerHTML;
                button.dataset.originalHtml = originalHtml;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            } else {
                button.classList.remove('loading');
                if (button.dataset.originalHtml) {
                    button.innerHTML = button.dataset.originalHtml;
                }
            }
        }
    }

    debounce(key, func, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }
}

// Security Manager  
class SecurityManager {
    constructor() {
        this.loginAttempts = new Map();
        this.rateLimits = new Map();
        this.maxLoginAttempts = 3;
        this.lockoutTime = 15 * 60 * 1000;
    }

    checkRateLimit(key, maxRequests, timeWindow) {
        const now = Date.now();
        const windowKey = `${key}_${Math.floor(now / timeWindow)}`;
        const requests = this.rateLimits.get(windowKey) || 0;
        if (requests >= maxRequests) return false;
        this.rateLimits.set(windowKey, requests + 1);
        return true;
    }

    recordLoginAttempt(clientId, success) {
        const now = Date.now();
        let attempts = this.loginAttempts.get(clientId) || { count: 0, lastAttempt: now };
        if (success) {
            this.loginAttempts.delete(clientId);
        } else {
            attempts.count++;
            attempts.lastAttempt = now;
            this.loginAttempts.set(clientId, attempts);
        }
    }

    isAccountLocked(clientId) {
        const attempts = this.loginAttempts.get(clientId);
        if (!attempts || attempts.count < this.maxLoginAttempts) return false;
        return (Date.now() - attempts.lastAttempt) < this.lockoutTime;
    }
}

// Input Sanitizer
class InputSanitizer {
    sanitizeAndValidate(input, type) {
        if (typeof input !== 'string') return null;
        
        let sanitized = input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
        
        switch(type) {
            case 'memberName':
                return this.validateMemberName(sanitized);
            case 'task':
                return this.validateTask(sanitized);
            case 'idea':
                return this.validateIdea(sanitized);
            default:
                return sanitized;
        }
    }

    validateMemberName(name) {
        if (!/^[A-Za-z\s]{2,50}$/.test(name)) return null;
        return name;
    }

    validateTask(task) {
        if (task.length < 5 || task.length > 500) return null;
        return task;
    }

    validateIdea(idea) {
        if (idea.length < 10 || idea.length > 1000) return null;
        return idea;
    }
}

// COMPLETE Team Manager - Modern Version
class CompleteTeamManager {
    constructor() {
        this.teamId = 'ai-t19';
        this.members = [
            'Vasantha Kumar N', 'Dheeraj R', 'Gokul T', 'Siva Prasanth K',
            'Sanjay S', 'Rohith Vignesh N', 'Prabhu M', 'Prithivi Raj M',
            'Kamalesh R', 'Ashok Kumar S'
        ];
        
        this.memberDetails = {};
        this.attendance = {};
        this.tasks = {};
        this.ideas = [];
        this.assignedTasks = {};
        this.currentSelectedMember = null;
        this.isAdminLoggedIn = false;
        this.adminPassword = 'admin123';
        this.database = null;
        this.auth = null;
        this.isOnline = false;
        this.connectionState = 'initializing';
        this.listeners = new Map();
        this.syncQueue = [];
        this.statusTimeout = null;
        this.syncErrors = [];
        this.lastSyncTime = null;
        
        this.performance = new PerformanceManager();
        this.security = new SecurityManager();
        this.sanitizer = new InputSanitizer();
        
        console.log('Complete Team Manager initialized - Modern Version');
        this.init();
    }

    async init() {
        try {
            this.loadLocalData();
            this.initializeMemberDetails();
            await this.initializeFirebaseWithSafeGuards();
            this.setupEventListeners();
            this.populateAllSelects();
            this.setTodayDate();
            this.updateAllDisplays();
            
            this.showConnectionStatus('online', 'System Ready');
            this.showMessage('System ready with Firebase real-time sync', 'success');
            console.log('System fully initialized with Firebase SAFE sync');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showConnectionStatus('offline', 'Working Offline');
            this.showMessage('Working in offline mode. Data will sync when connection is restored.', 'warning');
        }
    }

    initializeMemberDetails() {
        this.members.forEach(member => {
            if (!this.memberDetails[member]) {
                this.memberDetails[member] = {
                    name: member,
                    email: '',
                    phone: '',
                    role: 'Team Member',
                    joinDate: new Date().toISOString().split('T')[0],
                    status: 'Active',
                    notes: ''
                };
            }
        });
    }

    // FIXED: SAFE Firebase initialization
    async initializeFirebaseWithSafeGuards() {
        try {
            console.log('Connecting to Firebase with SAFE initialization...');
            
            if (typeof firebase === 'undefined') {
                console.error('Firebase SDK not loaded. Please check script tags.');
                this.isOnline = false;
                this.updateSyncStatus('Firebase SDK Missing');
                return;
            }

            let app;
            try {
                app = firebase.app();
                console.log('Firebase already initialized, reusing existing instance');
            } catch (error) {
                console.log('Initializing Firebase for the first time...');
                app = firebase.initializeApp(firebaseConfig);
            }
            
            this.database = firebase.database();
            this.auth = firebase.auth();
            
            try {
                await this.database.goOffline();
                await this.database.goOnline();
                console.log('Firebase offline/online sync enabled');
            } catch (error) {
                console.log('Firebase sync already configured');
            }
            
            try {
                await this.auth.signInAnonymously();
                console.log('Firebase authentication successful');
            } catch (authError) {
                if (authError.code !== 'auth/already-signed-in') {
                    console.log('Authentication handled:', authError.message);
                }
            }
            
            this.isOnline = true;
            this.updateSyncStatus('Connected');
            
            this.setupRealTimeListeners();
            await this.syncInitialDataFromFirebase();
            
            console.log('Firebase fully operational with SAFE real-time sync');
            
        } catch (error) {
            console.error('Firebase connection failed:', error);
            this.isOnline = false;
            this.updateSyncStatus('Offline');
            
            this.loadLocalData();
            this.updateAllDisplays();
            console.log('Running in offline mode - will sync when online');
        }
    }

    // Connection status display - NO OVERLAPPING
    showConnectionStatus(status, message) {
        try {
            const statusElement = document.getElementById('connectionStatus');
            const statusText = document.getElementById('statusText');
            
            if (statusElement && statusText) {
                // Clear any existing timeouts to prevent overlapping
                if (this.statusTimeout) {
                    clearTimeout(this.statusTimeout);
                }
                
                statusElement.style.display = 'flex';
                statusElement.className = `connection-status ${status}`;
                statusText.textContent = message;
                
                // Auto-hide success messages after 3 seconds
                if (status === 'online') {
                    this.statusTimeout = setTimeout(() => {
                        statusElement.style.display = 'none';
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Error showing connection status:', error);
        }
    }

    // Setup real-time listeners
    setupRealTimeListeners() {
        try {
            console.log('Setting up SAFE real-time listeners...');
            
            if (!this.database) {
                console.log('Database not available for listeners');
                return;
            }
            
            const teamRef = this.database.ref(`teams/${this.teamId}`);
            
            // Members listener
            teamRef.child('members').on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (Array.isArray(data) && JSON.stringify(data) !== JSON.stringify(this.members)) {
                        this.members = data;
                        console.log('Members synced:', data.length);
                        this.populateAllSelects();
                        this.updateAdminMembersList();
                        this.lastSyncTime = new Date();
                    }
                }
            });
            
            // Attendance listener
            teamRef.child('attendance').on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (JSON.stringify(data) !== JSON.stringify(this.attendance)) {
                        this.attendance = data;
                        console.log('Attendance synced');
                        this.updateAttendanceDisplay();
                        this.lastSyncTime = new Date();
                    }
                }
            });
            
            // Tasks listener
            teamRef.child('tasks').on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (JSON.stringify(data) !== JSON.stringify(this.tasks)) {
                        this.tasks = data;
                        console.log('Tasks synced');
                        if (this.currentSelectedMember) {
                            this.displayMemberTasks(this.currentSelectedMember);
                        }
                        this.lastSyncTime = new Date();
                    }
                }
            });
            
            // Ideas listener
            teamRef.child('ideas').on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (Array.isArray(data) && JSON.stringify(data) !== JSON.stringify(this.ideas)) {
                        this.ideas = data;
                        console.log('Ideas synced:', data.length);
                        this.updateIdeasDisplay();
                        this.lastSyncTime = new Date();
                    }
                }
            });
            
            // Connection state listener
            this.database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                this.isOnline = connected;
                const status = connected ? 'Connected' : 'Reconnecting...';
                this.updateSyncStatus(status);
                console.log('Firebase connection:', connected ? 'ONLINE' : 'OFFLINE');
                
                if (connected && this.syncQueue.length > 0) {
                    this.processOfflineQueue();
                }
            });
            
            console.log('SAFE real-time listeners established');
            
        } catch (error) {
            console.error('Error setting up SAFE listeners:', error);
        }
    }

    // Initial data sync
    async syncInitialDataFromFirebase() {
        try {
            console.log('Syncing initial data from Firebase...');
            
            const teamSnapshot = await this.database.ref(`teams/${this.teamId}`).once('value');
            
            if (teamSnapshot.exists()) {
                const data = teamSnapshot.val();
                
                if (data.members && Array.isArray(data.members)) {
                    this.members = data.members;
                }
                if (data.memberDetails) {
                    this.memberDetails = { ...this.memberDetails, ...data.memberDetails };
                }
                if (data.attendance) {
                    this.attendance = data.attendance;
                }
                if (data.tasks) {
                    this.tasks = data.tasks;
                }
                if (data.assignedTasks) {
                    this.assignedTasks = data.assignedTasks;
                }
                if (data.ideas && Array.isArray(data.ideas)) {
                    this.ideas = data.ideas;
                }
                
                console.log('Initial data synced from Firebase');
                this.lastSyncTime = new Date();
                this.updateAllDisplays();
            } else {
                console.log('First time setup - saving initial data to Firebase...');
                await this.saveAllDataToFirebase();
            }
            
        } catch (error) {
            console.error('Error syncing initial data:', error);
        }
    }

    // Save data to Firebase safely
    async saveDataToFirebase(path, data, retryCount = 0) {
        try {
            if (!this.database || !this.isOnline) {
                this.queueForOfflineSync(path, data);
                return false;
            }
            
            const fullPath = `teams/${this.teamId}/${path}`;
            const updates = {};
            updates[fullPath] = data;
            
            await this.database.ref().update(updates);
            console.log(`${path} saved to Firebase`);
            
            this[path] = data;
            this.saveLocalData(path, data);
            this.lastSyncTime = new Date();
            return true;
            
        } catch (error) {
            console.error(`Failed to save ${path}:`, error);
            
            if (retryCount < 3) {
                console.log(`Retrying save for ${path} (attempt ${retryCount + 1})`);
                setTimeout(() => {
                    this.saveDataToFirebase(path, data, retryCount + 1);
                }, 1000 * (retryCount + 1));
            } else {
                this.queueForOfflineSync(path, data);
            }
            
            return false;
        }
    }

    // Save all data
    async saveAllDataToFirebase() {
        try {
            const updates = {};
            const dataKeys = ['members', 'memberDetails', 'attendance', 'tasks', 'assignedTasks', 'ideas'];
            
            dataKeys.forEach(key => {
                updates[`teams/${this.teamId}/${key}`] = this[key];
            });
            
            updates[`teams/${this.teamId}/lastUpdated`] = firebase.database.ServerValue.TIMESTAMP;
            
            await this.database.ref().update(updates);
            console.log('All data saved to Firebase');
            this.lastSyncTime = new Date();
            
        } catch (error) {
            console.error('Failed to save all data:', error);
        }
    }

    // Queue for offline sync
    queueForOfflineSync(path, data) {
        const queueItem = {
            path,
            data,
            timestamp: Date.now()
        };
        
        this.syncQueue = this.syncQueue.filter(item => item.path !== path);
        this.syncQueue.push(queueItem);
        
        console.log(`${path} queued for offline sync (queue: ${this.syncQueue.length})`);
    }

    // Process offline queue
    async processOfflineQueue() {
        if (this.syncQueue.length === 0) return;
        
        console.log(`Processing offline queue (${this.syncQueue.length} items)`);
        
        const queueCopy = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queueCopy) {
            try {
                await this.saveDataToFirebase(item.path, item.data);
                console.log(`Offline sync completed for ${item.path}`);
            } catch (error) {
                console.error(`Offline sync failed for ${item.path}:`, error);
                this.queueForOfflineSync(item.path, item.data);
            }
        }
    }

    // ATTENDANCE FUNCTIONS
    async markAttendance() {
        console.log('Mark Attendance clicked');
        
        const buttonId = 'markAttendanceBtn';
        if (this.performance.isButtonBusy(buttonId)) return;
        this.performance.setBusy(buttonId, true);
        
        try {
            const date = document.getElementById('sessionDate').value;
            const member = document.getElementById('attendanceMember').value;
            const status = document.querySelector('input[name="attendanceStatus"]:checked')?.value;

            if (!date || !member || !status) {
                this.showMessage('Please fill all fields', 'error');
                return;
            }

                        if (!this.attendance[date]) this.attendance[date] = {};
            this.attendance[date][member] = status;

            // Clear form
            document.getElementById('attendanceMember').value = '';
            document.querySelectorAll('input[name="attendanceStatus"]').forEach(radio => {
                radio.checked = false;
            });
            this.updateRadioStyles();
            
            // Save to Firebase
            const success = await this.saveDataToFirebase('attendance', this.attendance);
            
            if (success) {
                this.showMessage(`Attendance marked and synced: ${member} - ${status}`, 'success');
            } else {
                this.showMessage(`Attendance marked: ${member} - ${status} (will sync when online)`, 'warning');
            }
            
        } catch (error) {
            console.error('Mark attendance failed:', error);
            this.showMessage('Failed to mark attendance', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    updateAttendanceDisplay() {
        try {
            const membersList = document.getElementById('membersList');
            if (!membersList) return;

            const today = new Date().toISOString().split('T')[0];
            const todayAttendance = this.attendance[today] || {};

            let presentCount = 0, absentCount = 0, notMarkedCount = 0;

            this.members.forEach(member => {
                const status = todayAttendance[member];
                if (status === 'present') presentCount++;
                else if (status === 'absent') absentCount++;
                else notMarkedCount++;
            });

            const membersHTML = this.members.map(member => {
                const status = todayAttendance[member] || 'not-marked';
                const statusIcon = status === 'present' ? 'check' : status === 'absent' ? 'times' : 'clock';
                const statusText = status === 'not-marked' ? 'Not Marked' : status.charAt(0).toUpperCase() + status.slice(1);
                
                return `
                    <div class="member-card ${status}">
                        <div class="member-header">
                            <div class="member-name">${member}</div>
                            <div class="status-badge status-${status}">
                                <i class="fas fa-${statusIcon}"></i>
                                ${statusText}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            membersList.innerHTML = `
                <div class="attendance-date-group">
                    <div class="date-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, var(--gray-50), white); border-radius: 1rem; border: 2px solid var(--gray-200);">
                        <span style="font-size: 1.125rem; font-weight: 600; color: var(--gray-900);"><i class="fas fa-calendar-day" style="margin-right: 0.5rem; color: var(--primary);"></i> Today's Attendance - ${new Date().toLocaleDateString()}</span>
                        <span class="sync-indicator" style="color: ${this.isOnline ? '#059669' : '#d97706'}; font-size: 0.875rem; font-weight: 500;">
                            <i class="fas fa-${this.isOnline ? ' ' : ' '}" style="margin-right: 0.5rem;"></i> 
                            ${this.isOnline ? ' ' : 'Offline'}
                        </span>
                    </div>
                    <div class="members-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                        ${membersHTML}
                    </div>
                </div>
            `;

            // Update stats
            const updates = [
                ['presentCount', presentCount],
                ['absentCount', absentCount],
                ['notMarkedCount', notMarkedCount],
                ['attendanceRate', this.members.length > 0 ? Math.round((presentCount / this.members.length) * 100) + '%' : '0%']
            ];
            
            updates.forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
        } catch (error) {
            console.error('Error updating attendance display:', error);
        }
    }

    // TASK FUNCTIONS
    loadMemberTasks() {
        console.log('Load Member Tasks clicked');
        
        try {
            const selectedMember = document.getElementById('taskMemberSelect').value;
            
            if (!selectedMember || !this.members.includes(selectedMember)) {
                this.showMessage('Please select a valid member', 'error');
                return;
            }
            
            this.currentSelectedMember = selectedMember;
            
            const taskDashboard = document.getElementById('taskDashboard');
            if (taskDashboard) {
                taskDashboard.style.display = 'block';
                
                const memberNameDisplay = document.getElementById('selectedMemberName');
                if (memberNameDisplay) memberNameDisplay.textContent = selectedMember;
                
                this.displayMemberTasks(selectedMember);
                
                taskDashboard.scrollIntoView({ behavior: 'smooth' });
                this.showMessage(`Tasks loaded for ${selectedMember}`, 'success');
            }
            
        } catch (error) {
            console.error('Error loading member tasks:', error);
            this.showMessage('Failed to load member tasks', 'error');
        }
    }

    displayMemberTasks(memberName) {
        const regularTasksList = document.getElementById('regularTasksList');
        const assignedTasksList = document.getElementById('assignedTasksList');
        
        if (regularTasksList) {
            const memberTasks = this.tasks[memberName] || [];
            
            if (memberTasks.length === 0) {
                regularTasksList.innerHTML = '<div class="no-tasks">No regular tasks yet</div>';
            } else {
                const html = memberTasks.map((task, index) => `
                    <div class="task-card ${task.status || 'pending'}">
                        <div class="task-header">
                            <div class="task-title">Task ${index + 1}</div>
                            <div class="task-actions">
                                <button class="btn btn-sm btn-warning" onclick="window.teamManager.updateTaskStatus('${memberName}', ${index})">
                                    <i class="fas fa-edit"></i> Update
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="window.teamManager.deleteTask('${memberName}', ${index})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        <div class="task-content">
                            <div class="task-description">${task.description || task}</div>
                            <div class="task-date">Added: ${task.date || 'Unknown'}</div>
                        </div>
                    </div>
                `).join('');
                
                regularTasksList.innerHTML = html;
            }
        }

        if (assignedTasksList) {
            const memberAssignedTasks = this.assignedTasks[memberName] || [];
            
            if (memberAssignedTasks.length === 0) {
                assignedTasksList.innerHTML = '<div class="no-tasks">No assigned tasks yet</div>';
            } else {
                const html = memberAssignedTasks.map((task, index) => `
                    <div class="task-card assigned ${task.status || 'pending'}">
                        <div class="task-header">
                            <div class="task-title">${task.title}</div>
                            <div class="task-priority priority-${task.priority || 'normal'}">${task.priority || 'Normal'}</div>
                        </div>
                        <div class="task-content">
                            <div class="task-description">${task.description}</div>
                            <div class="task-date">Assigned: ${task.assignedDate || 'Unknown'}</div>
                        </div>
                    </div>
                `).join('');
                
                assignedTasksList.innerHTML = html;
            }
        }

        this.updateTaskSummaryStats(memberName);
    }

    async addNewTask() {
        console.log('Add New Task clicked');
        
        const buttonId = 'addNewTaskBtn';
        if (this.performance.isButtonBusy(buttonId)) return;
        this.performance.setBusy(buttonId, true);
        
        try {
            const description = document.getElementById('newTaskDescription').value.trim();
            
            if (!this.currentSelectedMember) {
                this.showMessage('Please select a member first', 'error');
                return;
            }
            
            if (!description) {
                this.showMessage('Please enter a task description', 'error');
                return;
            }
            
            const sanitizedDescription = this.sanitizer.sanitizeAndValidate(description, 'task');
            if (!sanitizedDescription) {
                this.showMessage('Invalid task description. Use 5-500 characters', 'error');
                return;
            }
            
            if (!this.tasks[this.currentSelectedMember]) {
                this.tasks[this.currentSelectedMember] = [];
            }
            
            const newTask = {
                description: sanitizedDescription,
                status: 'pending',
                date: new Date().toLocaleDateString(),
                timestamp: new Date().toISOString()
            };
            
            this.tasks[this.currentSelectedMember].push(newTask);
            document.getElementById('newTaskDescription').value = '';
            
            const success = await this.saveDataToFirebase('tasks', this.tasks);
            
            if (success) {
                this.showMessage(`Task added for ${this.currentSelectedMember} and synced`, 'success');
            } else {
                this.showMessage(`Task added for ${this.currentSelectedMember} (will sync when online)`, 'warning');
            }
            
        } catch (error) {
            console.error('Add new task failed:', error);
            this.showMessage('Failed to add task', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    async updateTaskStatus(memberName, taskIndex) {
        const newStatus = prompt('Enter new status (pending, in-progress, completed, blocked):');
        if (newStatus && this.tasks[memberName] && this.tasks[memberName][taskIndex]) {
            const validStatuses = ['pending', 'in-progress', 'completed', 'blocked'];
            if (validStatuses.includes(newStatus.toLowerCase())) {
                this.tasks[memberName][taskIndex].status = newStatus.toLowerCase();
                
                await this.saveDataToFirebase('tasks', this.tasks);
                this.showMessage('Task status updated and synced', 'success');
            } else {
                this.showMessage('Invalid status', 'error');
            }
        }
    }

    async deleteTask(memberName, taskIndex) {
        if (confirm('Delete this task?')) {
            if (this.tasks[memberName] && this.tasks[memberName][taskIndex] !== undefined) {
                this.tasks[memberName].splice(taskIndex, 1);
                
                await this.saveDataToFirebase('tasks', this.tasks);
                this.showMessage('Task deleted and synced', 'success');
            }
        }
    }

    updateTaskSummaryStats(memberName) {
        try {
            const regularTasks = this.tasks[memberName] || [];
            const assignedTasks = this.assignedTasks[memberName] || [];
            const allTasks = [...regularTasks, ...assignedTasks];
            
            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter(task => task.status === 'completed').length;
            const pendingTasks = allTasks.filter(task => task.status === 'pending' || !task.status).length;
            const inProgressTasks = allTasks.filter(task => task.status === 'in-progress').length;
            
            const elements = [
                ['memberTaskCount', totalTasks],
                ['memberCompletedTasks', completedTasks],
                ['memberPendingTasks', pendingTasks],
                ['memberInProgressTasks', inProgressTasks]
            ];
            
            elements.forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
            
        } catch (error) {
            console.error('Error updating task summary stats:', error);
        }
    }

    // IDEAS FUNCTIONS
    async addIdea() {
        console.log('Add Idea clicked');
        
        const buttonId = 'addIdeaBtn';
        if (this.performance.isButtonBusy(buttonId)) return;
        this.performance.setBusy(buttonId, true);
        
        try {
            const member = document.getElementById('ideaMember').value;
            const content = document.getElementById('ideaContent').value.trim();

            if (!member || !content) {
                this.showMessage('Please fill all fields', 'error');
                return;
            }

            if (!this.members.includes(member)) {
                this.showMessage('Selected member not found', 'error');
                return;
            }

            const sanitizedContent = this.sanitizer.sanitizeAndValidate(content, 'idea');
            if (!sanitizedContent) {
                this.showMessage('Invalid idea. Use 10-1000 characters', 'error');
                return;
            }

            const idea = {
                id: Date.now().toString(),
                member: member,
                content: sanitizedContent,
                date: new Date().toLocaleDateString(),
                timestamp: new Date().toISOString()
            };

            this.ideas.unshift(idea);
            
            document.getElementById('ideaMember').value = '';
            document.getElementById('ideaContent').value = '';
            
            const success = await this.saveDataToFirebase('ideas', this.ideas);
            
            if (success) {
                this.showMessage('Idea shared and synced across all devices', 'success');
            } else {
                this.showMessage('Idea shared (will sync when online)', 'warning');
            }
            
        } catch (error) {
            console.error('Add idea failed:', error);
            this.showMessage('Failed to share idea', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    updateIdeasDisplay() {
        try {
            const ideasBoard = document.getElementById('ideasBoard');
            if (!ideasBoard) return;

            if (this.ideas.length === 0) {
                ideasBoard.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--gray-500); background: linear-gradient(135deg, var(--gray-50), white); border-radius: 1.5rem; border: 2px dashed var(--gray-300);">
                        <i class="fas fa-lightbulb" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p style="font-size: 1.125rem; font-weight: 500;">No ideas shared yet. Be the first to share!</p>
                    </div>
                `;
                return;
            }

            const html = this.ideas.map(idea => `
                <div class="idea-card">
                    <button class="delete-btn" onclick="window.teamManager.deleteIdea('${idea.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="idea-author">${idea.member} - ${idea.date}</div>
                    <div class="idea-content">${idea.content}</div>
                </div>
            `).join('');

            const syncStatus = `
                <div style="text-align: center; padding: 1rem; margin-top: 1.5rem; color: ${this.isOnline ? '#059669' : '#d97706'}; font-size: 0.875rem; background: ${this.isOnline ? '#ecfdf5' : '#fffbeb'}; border-radius: 1rem; border: 1px solid ${this.isOnline ? '#a7f3d0' : '#fde68a'};">
                    <i class="fas fa-${this.isOnline ? 'sync-alt' : 'wifi-slash'}" style="margin-right: 0.5rem;"></i> 
                    ${this.isOnline ? 'Real-time sync active' : 'Offline - changes will sync when online'}
                </div>
            `;

            ideasBoard.innerHTML = html + syncStatus;
        } catch (error) {
            console.error('Error updating ideas display:', error);
        }
    }

    async deleteIdea(id) {
        if (confirm('Delete this idea?')) {
            this.ideas = this.ideas.filter(idea => idea.id !== id);
            
            await this.saveDataToFirebase('ideas', this.ideas);
            this.showMessage('Idea deleted and synced', 'success');
        }
    }

    // OVERVIEW FUNCTIONS
    toggleActivityFeed() {
        console.log('Toggle Activity Feed clicked');
        
        const feed = document.getElementById('activityFeed');
        const btn = document.getElementById('toggleActivityBtn');
        
        if (feed && btn) {
            if (feed.style.display === 'none' || !feed.style.display) {
                feed.style.display = 'block';
                btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Activity Feed';
                this.updateActivityFeed();
            } else {
                feed.style.display = 'none';
                btn.innerHTML = '<i class="fas fa-stream"></i> Activity Feed';
            }
        }
    }

    updateActivityFeed() {
        const list = document.getElementById('activityList');
        if (list) {
            const syncTime = this.lastSyncTime ? this.lastSyncTime.toLocaleTimeString() : 'Never';
            const activities = [
                {
                    icon: 'rocket',
                    text: 'Enhanced Firebase real-time sync active',
                    time: 'Now',
                    type: 'system'
                },
                {
                    icon: this.isOnline ? 'wifi' : 'wifi-slash',
                    text: `Connection: ${this.isOnline ? 'Real-time Active' : 'Offline Mode'}`,
                    time: syncTime,
                    type: this.isOnline ? 'success' : 'warning'
                },
                {
                    icon: 'database',
                    text: `Data sync queue: ${this.syncQueue.length} items`,
                    time: 'Now',
                    type: 'info'
                },
                {
                    icon: 'users',
                    text: `Active members: ${this.members.length}`,
                    time: 'Live',
                    type: 'info'
                },
                {
                    icon: 'chart-bar',
                    text: `Total tasks: ${this.calculateTotalTasks()}`,
                    time: 'Live',
                    type: 'info'
                }
            ];

            const html = activities.map(activity => `
                <div class="activity-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin-bottom: 0.75rem; background: white; border-radius: 0.75rem; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="activity-icon" style="width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--${activity.type === 'success' ? 'success' : activity.type === 'warning' ? 'warning' : activity.type === 'system' ? 'primary' : 'info'}-light); color: var(--${activity.type === 'success' ? 'success' : activity.type === 'warning' ? 'warning' : activity.type === 'system' ? 'primary' : 'info'});">
                            <i class="fas fa-${activity.icon}"></i>
                        </div>
                        <span style="font-weight: 500; color: var(--gray-700);">${activity.text}</span>
                    </div>
                    <span class="activity-time" style="font-size: 0.75rem; color: var(--gray-500); font-weight: 600;">${activity.time}</span>
                </div>
            `).join('');

            list.innerHTML = html;
        }
    }

    showPerformanceReport() {
        console.log('Performance Report clicked');
        
        try {
            const performanceReport = document.getElementById('performanceReport');
            const performanceContent = document.getElementById('performanceContent');
            const btn = document.getElementById('performanceReportBtn');
            
            if (!performanceReport || !performanceContent) {
                this.showMessage('Performance report elements not found', 'error');
                return;
            }
            
            if (performanceReport.style.display === 'none' || !performanceReport.style.display) {
                performanceReport.style.display = 'block';
                btn.innerHTML = '<i class="fas fa-chart-bar"></i> Hide Performance';
                
                const reportHTML = this.generateCompletePerformanceReport();
                performanceContent.innerHTML = reportHTML;
                
                performanceReport.scrollIntoView({ behavior: 'smooth' });
            } else {
                performanceReport.style.display = 'none';
                btn.innerHTML = '<i class="fas fa-chart-bar"></i> Performance Report';
            }
            
        } catch (error) {
            console.error('Performance report error:', error);
            this.showMessage('Failed to generate performance report', 'error');
        }
    }

    generateCompletePerformanceReport() {
        try {
            const totalMembers = this.members.length;
            const totalTasks = this.calculateTotalTasks();
            const totalIdeas = this.ideas.length;
            const avgAttendance = this.calculateAvgAttendance();
            
            const allMemberPerformance = this.calculateAllMembersPerformance();
            
            return `
                <div class="performance-overview" style="background: linear-gradient(135deg, var(--primary-light), white); padding: 2rem; border-radius: 1.5rem; border: 2px solid rgba(79, 70, 229, 0.2); margin-bottom: 2rem;">
                    <h4 style="color: var(--primary); font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-chart-pie"></i> Enhanced Team Performance Analysis
                    </h4>
                    <div class="sync-info" style="background: ${this.isOnline ? '#ecfdf5' : '#fffbeb'}; color: ${this.isOnline ? '#065f46' : '#d97706'}; padding: 1rem; border-radius: 0.75rem; margin-bottom: 1.5rem; text-align: center; border: 1px solid ${this.isOnline ? '#a7f3d0' : '#fde68a'};">
                        <i class="fas fa-${this.isOnline ? 'wifi' : 'wifi-slash'}" style="margin-right: 0.5rem;"></i> 
                        ${this.isOnline ? 'Real-time data sync active - All changes are live across devices' : 'Offline mode - Changes will sync when connection is restored'}
                        ${this.lastSyncTime ? ` • Last sync: ${this.lastSyncTime.toLocaleTimeString()}` : ''}
                    </div>
                    <div class="performance-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div class="metric-card" style="background: white; padding: 1.5rem; border-radius: 1rem; text-align: center; border: 1px solid var(--gray-200); box-shadow: var(--shadow);">
                            <div class="metric-title" style="font-size: 0.875rem; color: var(--gray-600); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Team Size</div>
                            <div class="metric-value" style="font-size: 2rem; font-weight: 800; color: var(--primary); margin-bottom: 0.25rem;">${totalMembers}</div>
                            <div class="metric-trend" style="font-size: 0.75rem; color: var(--gray-500);">Complete Team</div>
                        </div>
                        <div class="metric-card" style="background: white; padding: 1.5rem; border-radius: 1rem; text-align: center; border: 1px solid var(--gray-200); box-shadow: var(--shadow);">
                            <div class="metric-title" style="font-size: 0.875rem; color: var(--gray-600); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Total Tasks</div>
                            <div class="metric-value" style="font-size: 2rem; font-weight: 800; color: var(--success); margin-bottom: 0.25rem;">${totalTasks}</div>
                            <div class="metric-trend" style="font-size: 0.75rem; color: var(--gray-500);">${totalTasks > totalMembers ? 'High Productivity' : 'Building'}</div>
                        </div>
                        <div class="metric-card" style="background: white; padding: 1.5rem; border-radius: 1rem; text-align: center; border: 1px solid var(--gray-200); box-shadow: var(--shadow);">
                            <div class="metric-title" style="font-size: 0.875rem; color: var(--gray-600); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Ideas Generated</div>
                            <div class="metric-value" style="font-size: 2rem; font-weight: 800; color: var(--warning); margin-bottom: 0.25rem;">${totalIdeas}</div>
                            <div class="metric-trend" style="font-size: 0.75rem; color: var(--gray-500);">${totalIdeas > totalMembers ? 'Creative Team' : 'Growing'}</div>
                        </div>
                        <div class="metric-card" style="background: white; padding: 1.5rem; border-radius: 1rem; text-align: center; border: 1px solid var(--gray-200); box-shadow: var(--shadow);">
                            <div class="metric-title" style="font-size: 0.875rem; color: var(--gray-600); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Avg Attendance</div>
                            <div class="metric-value" style="font-size: 2rem; font-weight: 800; color: var(--info); margin-bottom: 0.25rem;">${avgAttendance}%</div>
                            <div class="metric-trend" style="font-size: 0.75rem; color: var(--gray-500);">${avgAttendance >= 80 ? 'Excellent' : avgAttendance >= 60 ? 'Good' : 'Improving'}</div>
                        </div>
                        <div class="metric-card" style="background: white; padding: 1.5rem; border-radius: 1rem; text-align: center; border: 1px solid var(--gray-200); box-shadow: var(--shadow);">
                            <div class="metric-title" style="font-size: 0.875rem; color: var(--gray-600); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Sync Status</div>
                            <div class="metric-value" style="font-size: 2rem; font-weight: 800; color: ${this.isOnline ? 'var(--success)' : 'var(--warning)'}; margin-bottom: 0.25rem;">${this.isOnline ? 'LIVE' : 'OFFLINE'}</div>
                            <div class="metric-trend" style="font-size: 0.75rem; color: var(--gray-500);">Firebase Real-time</div>
                        </div>
                    </div>
                </div>

                <div class="performance-section" style="background: white; padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--gray-200); box-shadow: var(--shadow-lg); margin-bottom: 2rem;">
                    <h4 style="color: var(--gray-900); font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-trophy"></i> Individual Performance Rankings
                    </h4>
                    <div class="ranking-controls" style="margin-bottom: 1.5rem;">
                        <button class="btn btn-sm btn-info" onclick="window.teamManager.exportTopPerformerReport()">
                            <i class="fas fa-download"></i> Export Top Performer
                        </button>
                        <button class="btn btn-sm btn-success" onclick="window.teamManager.exportCategoryPDF()">
                            <i class="fas fa-file-pdf"></i> Export Rankings PDF
                        </button>
                    </div>
                    
                    <div class="member-performance-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
                        ${allMemberPerformance.map((member, index) => `
                            <div class="performance-member-card ${index < 3 ? 'top-performer' : ''}" style="background: linear-gradient(135deg, white, var(--gray-50)); border: 2px solid ${index < 3 ? 'var(--primary)' : 'var(--gray-200)'}; border-radius: 1rem; padding: 1.5rem; position: relative; ${index < 3 ? 'box-shadow: 0 8px 32px rgba(79, 70, 229, 0.2);' : 'box-shadow: var(--shadow);'}">
                                <div class="performance-rank rank-${index + 1}" style="position: absolute; top: -0.5rem; right: -0.5rem; background: ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--primary)'}; color: ${index < 3 ? '#000' : '#fff'}; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">${index + 1}</div>
                                <div class="member-info" style="text-align: center; margin-bottom: 1rem;">
                                    <h5 style="font-size: 1.125rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.5rem;">${member.name}</h5>
                                    <div class="performance-score" style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">Score: ${member.score}%</div>
                                </div>
                                <div class="performance-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                                    <div class="stat-item" style="text-align: center; padding: 0.75rem; background: rgba(79, 70, 229, 0.1); border-radius: 0.5rem;">
                                        <span class="stat-number" style="display: block; font-size: 1.25rem; font-weight: 700; color: var(--primary);">${member.attendanceRate}%</span>
                                        <span class="stat-label" style="font-size: 0.75rem; color: var(--gray-600); text-transform: uppercase;">Attendance</span>
                                    </div>
                                    <div class="stat-item" style="text-align: center; padding: 0.75rem; background: rgba(5, 150, 105, 0.1); border-radius: 0.5rem;">
                                        <span class="stat-number" style="display: block; font-size: 1.25rem; font-weight: 700; color: var(--success);">${member.ideaCount}</span>
                                        <span class="stat-label" style="font-size: 0.75rem; color: var(--gray-600); text-transform: uppercase;">Ideas</span>
                                    </div>
                                    <div class="stat-item" style="text-align: center; padding: 0.75rem; background: rgba(14, 165, 233, 0.1); border-radius: 0.5rem;">
                                        <span class="stat-number" style="display: block; font-size: 1.25rem; font-weight: 700; color: var(--info);">${member.taskCount || 0}</span>
                                        <span class="stat-label" style="font-size: 0.75rem; color: var(--gray-600); text-transform: uppercase;">Tasks</span>
                                    </div>
                                    <div class="stat-item" style="text-align: center; padding: 0.75rem; background: rgba(217, 119, 6, 0.1); border-radius: 0.5rem;">
                                        <span class="stat-number" style="display: block; font-size: 1.25rem; font-weight: 700; color: var(--warning);">${member.activeDays || 0}</span>
                                        <span class="stat-label" style="font-size: 0.75rem; color: var(--gray-600); text-transform: uppercase;">Days</span>
                                    </div>
                                </div>
                                <div class="performance-badge ${this.getPerformanceBadgeClass(member.score)}" style="text-align: center; padding: 0.5rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; ${this.getPerformanceBadgeStyle(member.score)}">
                                    ${this.getPerformanceBadge(member.score)}
                                </div>
                                <div class="individual-actions" style="margin-top: 1rem; text-align: center;">
                                    <button class="btn btn-sm btn-primary" onclick="window.teamManager.generateIndividualReport('${member.name}')">
                                        <i class="fas fa-user"></i> Individual PDF
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="report-footer" style="background: var(--gray-50); padding: 1.5rem; border-radius: 1rem; border: 1px solid var(--gray-200); text-align: center; color: var(--gray-600);">
                    <p style="margin-bottom: 0.5rem;"><i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i> Report generated on ${new Date().toLocaleString()}</p>
                    <p style="margin-bottom: 0.5rem;"><i class="fas fa-sync-alt" style="margin-right: 0.5rem;"></i> Firebase Sync: ${this.isOnline ? 'REAL-TIME ACTIVE' : 'OFFLINE MODE'}</p>
                    <p style="margin-bottom: 0.5rem;"><i class="fas fa-users" style="margin-right: 0.5rem;"></i> Individual Rankings: All ${totalMembers} Members</p>
                    <p style="margin-bottom: 0;"><i class="fas fa-database" style="margin-right: 0.5rem;"></i> Enhanced PDF export with individual reports available</p>
                </div>
            `;
        } catch (error) {
            console.error('Error generating performance report:', error);
            return `<div class="error-message" style="padding: 2rem; text-align: center; color: var(--danger);"><h4>Error Generating Report</h4><p>${error.message}</p></div>`;
        }
    }

    getPerformanceBadge(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Improving';
        return 'Focus Needed';
    }

    getPerformanceBadgeClass(score) {
        if (score >= 90) return 'badge-excellent';
        if (score >= 80) return 'badge-very-good';
        if (score >= 70) return 'badge-good';
        if (score >= 60) return 'badge-improving';
        return 'badge-needs-focus';
    }

    getPerformanceBadgeStyle(score) {
        if (score >= 90) return 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;';
        if (score >= 80) return 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
        if (score >= 70) return 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;';
        if (score >= 60) return 'background: #fecaca; color: #dc2626; border: 1px solid #fecaca;';
        return 'background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;';
    }

    previewReport() {
        console.log('Preview Report clicked');
        
        try {
            const reportPreview = document.getElementById('reportPreview');
            const reportContent = document.getElementById('reportPreviewContent');
            
            if (!reportPreview || !reportContent) {
                this.showMessage('Report preview elements not found', 'error');
                return;
            }
            
            if (reportPreview.style.display === 'none' || !reportPreview.style.display) {
                reportPreview.style.display = 'block';
                
                const previewHTML = this.generateEnhancedPreview();
                reportContent.innerHTML = previewHTML;
                
                reportPreview.scrollIntoView({ behavior: 'smooth' });
                this.showMessage('Report preview generated with real-time data', 'success');
            } else {
                reportPreview.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Preview error:', error);
            this.showMessage('Preview failed', 'error');
        }
    }

    generateEnhancedPreview() {
        const rankings = this.calculateAllMembersPerformance();
        
        return `
            <div class="report-header" style="background: linear-gradient(135deg, var(--primary-light), white); padding: 2rem; border-radius: 1rem; border: 2px solid rgba(79, 70, 229, 0.2); margin-bottom: 1.5rem;">
                <h4 style="color: var(--primary); font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Enhanced Team Report Preview</h4>
                <p style="color: var(--gray-600); margin-bottom: 1rem;">Generated: ${new Date().toLocaleString()}</p>
                <div style="background: ${this.isOnline ? '#ecfdf5' : '#fffbeb'}; color: ${this.isOnline ? '#065f46' : '#d97706'}; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; border: 1px solid ${this.isOnline ? '#a7f3d0' : '#fde68a'};">
                    <i class="fas fa-${this.isOnline ? 'wifi' : 'wifi-slash'}" style="margin-right: 0.5rem;"></i> 
                    ${this.isOnline ? 'Real-time sync active' : 'Offline mode'}
                    ${this.lastSyncTime ? ` • Last sync: ${this.lastSyncTime.toLocaleTimeString()}` : ''}
                </div>
            </div>
            
            <div class="preview-summary">
                <div class="summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="summary-item" style="background: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); text-align: center;"><strong>Members:</strong> ${this.members.length}</div>
                    <div class="summary-item" style="background: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); text-align: center;"><strong>Ideas:</strong> ${this.ideas.length}</div>
                    <div class="summary-item" style="background: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); text-align: center;"><strong>Tasks:</strong> ${this.calculateTotalTasks()}</div>
                    <div class="summary-item" style="background: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); text-align: center;"><strong>Attendance:</strong> ${this.calculateAvgAttendance()}%</div>
                    <div class="summary-item" style="background: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); text-align: center;"><strong>Top Performer:</strong> ${rankings[0]?.name || 'N/A'}</div>
                    <div class="summary-item" style="background: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); text-align: center;"><strong>Sync Status:</strong> ${this.isOnline ? 'Live' : 'Offline'}</div>
                </div>
                
                <h5 style="color: var(--gray-900); font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Report Contents:</h5>
                <ul style="background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); list-style: none; margin: 0;">
                    <li style="margin-bottom: 0.5rem; color: var(--gray-700);"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Team Overview & Statistics (Real-time)</li>
                    <li style="margin-bottom: 0.5rem; color: var(--gray-700);"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Individual Performance Rankings (Live Data)</li>
                    <li style="margin-bottom: 0.5rem; color: var(--gray-700);"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Member-specific PDF Reports</li>
                    <li style="margin-bottom: 0.5rem; color: var(--gray-700);"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Top Performer Analysis</li>
                    <li style="margin-bottom: 0.5rem; color: var(--gray-700);"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Enhanced PDF Export with Real-time Sync</li>
                    <li style="margin-bottom: 0; color: var(--gray-700);"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Multi-device Firebase Synchronization</li>
                </ul>
                
                <div class="preview-note" style="background: var(--info-light); color: var(--info); padding: 1rem; border-radius: 0.75rem; margin-top: 1rem; border: 1px solid rgba(14, 165, 233, 0.2);">
                    <p style="margin: 0;"><i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i> Enhanced system with Firebase real-time sync ensures all data is automatically synchronized across all devices and team members instantly.</p>
                </div>
            </div>
        `;
    }

    exportData() {
        console.log('Export JSON Data clicked');
        
        try {
            const exportData = {
                members: this.members,
                attendance: this.attendance,
                tasks: this.tasks,
                ideas: this.ideas,
                assignedTasks: this.assignedTasks,
                memberDetails: this.memberDetails,
                rankings: this.calculateAllMembersPerformance(),
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    exportTime: new Date().toLocaleString(),
                    totalMembers: this.members.length,
                    totalIdeas: this.ideas.length,
                    totalTasks: this.calculateTotalTasks(),
                    avgAttendance: this.calculateAvgAttendance(),
                    connectionStatus: this.isOnline ? 'REAL-TIME ACTIVE' : 'OFFLINE MODE',
                    lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
                    systemVersion: '3.0 Enhanced with Real-time Firebase Sync',
                    pdfExportAvailable: typeof window.jspdf !== 'undefined',
                    syncQueueSize: this.syncQueue.length
                }
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AI_T19_RealTimeSync_Data_${new Date().toISOString().split('T')[0]}.json`;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('Enhanced data exported with real-time sync info', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('Export failed', 'error');
        }
    }

    // ADMIN PANEL FUNCTIONS
    adminLogin() {
        console.log('Admin Login clicked');
        
        try {
            const password = document.getElementById('adminPassword').value;
            const clientIP = 'client_' + Date.now();

            if (this.security.isAccountLocked(clientIP)) {
                this.showMessage('Account temporarily locked', 'error');
                return;
            }

            if (password === this.adminPassword) {
                this.security.recordLoginAttempt(clientIP, true);
                this.isAdminLoggedIn = true;
                
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                document.getElementById('adminError').style.display = 'none';
                
                this.updateAdminMembersList();
                
                this.showMessage('Admin access granted with real-time sync', 'success');
            } else {
                this.security.recordLoginAttempt(clientIP, false);
                document.getElementById('adminError').style.display = 'block';
                document.getElementById('adminPassword').value = '';
                
                this.showMessage('Invalid password', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            this.showMessage('Login failed', 'error');
        }
    }

    async addMember() {
        console.log('Add Member clicked');
        
        const buttonId = 'addMemberBtn';
        if (this.performance.isButtonBusy(buttonId)) return;
        this.performance.setBusy(buttonId, true);
        
        try {
            const memberName = document.getElementById('newMemberName').value.trim();
            
            const sanitizedName = this.sanitizer.sanitizeAndValidate(memberName, 'memberName');
            if (!sanitizedName) {
                this.showMessage('Invalid name. Use 2-50 characters, letters only', 'error');
                return;
            }

            if (this.members.includes(sanitizedName)) {
                this.showMessage('Member already exists', 'error');
                return;
            }

            this.members.push(sanitizedName);
            
            this.memberDetails[sanitizedName] = {
                name: sanitizedName,
                email: '',
                phone: '',
                role: 'Team Member',
                joinDate: new Date().toISOString().split('T')[0],
                status: 'Active',
                notes: ''
            };
            
            document.getElementById('newMemberName').value = '';
            
            const success = await Promise.all([
                this.saveDataToFirebase('members', this.members),
                this.saveDataToFirebase('memberDetails', this.memberDetails)
            ]);
            
            if (success.some(s => s)) {
                this.showMessage(`Member "${sanitizedName}" added and synced across all devices`, 'success');
            } else {
                this.showMessage(`Member "${sanitizedName}" added (will sync when online)`, 'warning');
            }
            
        } catch (error) {
            console.error('Add member failed:', error);
            this.showMessage('Failed to add member', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    updateAdminMembersList() {
        const membersList = document.getElementById('adminMembersList');
        if (!membersList) return;
        
        const html = this.members.map(member => {
            const performance = this.calculateMemberPerformance(member);
            
            return `
                <div class="enhanced-member-item">
                    <div class="member-basic-info">
                        <div class="member-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="member-info">
                            <h5 class="member-name">${member}</h5>
                            <p class="member-role">Team Member</p>
                            <p class="member-status status-active">Active</p>
                        </div>
                    </div>
                    
                    <div class="member-stats">
                        <div class="stat-item">
                            <span class="stat-number">${performance.attendanceRate}%</span>
                            <span class="stat-label">Attendance</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${performance.taskCount}</span>
                            <span class="stat-label">Tasks</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${performance.ideaCount}</span>
                            <span class="stat-label">Ideas</span>
                        </div>
                    </div>
                    
                    <div class="member-actions">
                        <button class="btn btn-sm btn-warning" onclick="window.teamManager.promptUpdateMemberName('${member}')" title="Edit member name">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-info" onclick="window.teamManager.generateIndividualReport('${member}')" title="Generate PDF report">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.teamManager.removeMember('${member}')" title="Remove member">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        const syncBadge = `
            <div style="text-align: center; padding: 1rem; margin-top: 1.5rem; background: ${this.isOnline ? '#ecfdf5' : '#fffbeb'}; border-radius: 0.75rem; border: 2px solid ${this.isOnline ? '#10b981' : '#f59e0b'};">
                <div style="color: ${this.isOnline ? '#065f46' : '#d97706'}; font-weight: 600; margin-bottom: 0.5rem;">
                    <i class="fas fa-${this.isOnline ? 'wifi' : 'wifi-slash'}" style="margin-right: 0.5rem;"></i> 
                    ${this.isOnline ? 'Real-time sync active' : 'Offline mode - changes will sync when online'}
                </div>
                <div style="font-size: 0.75rem; color: ${this.isOnline ? '#059669' : '#d97706'};">
                    ${this.lastSyncTime ? `Last sync: ${this.lastSyncTime.toLocaleString()}` : 'No sync yet'}
                    ${this.syncQueue.length > 0 ? ` • Queue: ${this.syncQueue.length} items` : ''}
                </div>
            </div>
        `;
        
        membersList.innerHTML = html + syncBadge;
    }

    promptUpdateMemberName(currentName) {
        const newName = prompt(`Update member name from "${currentName}" to:`, currentName);
        if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
            this.updateMemberName(currentName, newName.trim());
        }
    }

    async updateMemberName(oldName, newName) {
        try {
            const sanitizedNewName = this.sanitizer.sanitizeAndValidate(newName, 'memberName');
            if (!sanitizedNewName) {
                throw new Error('Invalid new name. Use 2-50 characters, letters only.');
            }
            
            if (this.members.includes(sanitizedNewName) && sanitizedNewName !== oldName) {
                throw new Error('Member name already exists');
            }
            
            const oldIndex = this.members.indexOf(oldName);
            if (oldIndex === -1) {
                throw new Error('Original member not found');
            }
            
            this.members[oldIndex] = sanitizedNewName;
            
            if (this.memberDetails[oldName]) {
                this.memberDetails[sanitizedNewName] = { ...this.memberDetails[oldName] };
                this.memberDetails[sanitizedNewName].name = sanitizedNewName;
                delete this.memberDetails[oldName];
            }
            
            Object.keys(this.attendance).forEach(date => {
                if (this.attendance[date] && this.attendance[date][oldName]) {
                    this.attendance[date][sanitizedNewName] = this.attendance[date][oldName];
                    delete this.attendance[date][oldName];
                }
            });
            
            if (this.tasks[oldName]) {
                this.tasks[sanitizedNewName] = this.tasks[oldName];
                delete this.tasks[oldName];
            }
            
            if (this.assignedTasks[oldName]) {
                this.assignedTasks[sanitizedNewName] = this.assignedTasks[oldName];
                delete this.assignedTasks[oldName];
            }
            
            this.ideas.forEach(idea => {
                if (idea.member === oldName) {
                    idea.member = sanitizedNewName;
                }
            });
            
            await this.saveAllDataToFirebase();
            
            this.showMessage(`Member name updated from "${oldName}" to "${sanitizedNewName}" and synced across all devices`, 'success');
            
        } catch (error) {
            console.error('Update member name error:', error);
            this.showMessage(error.message, 'error');
        }
    }

    async removeMember(memberName) {
        if (confirm(`Remove "${memberName}"? This action will be synced across all devices.`)) {
            try {
                this.members = this.members.filter(member => member !== memberName);
                
                delete this.memberDetails[memberName];
                if (this.tasks[memberName]) delete this.tasks[memberName];
                if (this.assignedTasks[memberName]) delete this.assignedTasks[memberName];
                this.ideas = this.ideas.filter(idea => idea.member !== memberName);
                
                Object.keys(this.attendance).forEach(date => {
                    if (this.attendance[date] && this.attendance[date][memberName]) {
                        delete this.attendance[date][memberName];
                    }
                });

                await this.saveAllDataToFirebase();
                
                this.showMessage(`Member "${memberName}" removed and synced across all devices`, 'success');
                
            } catch (error) {
                console.error('Error removing member:', error);
                this.showMessage('Failed to remove member', 'error');
            }
        }
    }

    async assignTask() {
        console.log('Assign Task clicked');
        
        const buttonId = 'assignTaskBtn';
        if (this.performance.isButtonBusy(buttonId)) return;
        this.performance.setBusy(buttonId, true);
        
        try {
            const assignTo = document.getElementById('assignTaskMember').value;
            const taskTitle = document.getElementById('taskTitle').value.trim();
            const taskDescription = document.getElementById('taskDescription').value.trim();
            const priority = document.querySelector('input[name="taskPriority"]:checked')?.value || 'low';
            const deadline = document.getElementById('taskDeadline').value;

            if (!assignTo || !taskTitle || !taskDescription) {
                this.showMessage('Please fill all required fields', 'error');
                return;
            }

            const newTask = {
                id: Date.now().toString(),
                title: taskTitle,
                description: taskDescription,
                priority: priority,
                deadline: deadline || null,
                status: 'pending',
                assignedDate: new Date().toLocaleDateString(),
                assignedBy: 'Admin',
                timestamp: new Date().toISOString()
            };

            if (assignTo === 'all') {
                this.members.forEach(member => {
                    if (!this.assignedTasks[member]) this.assignedTasks[member] = [];
                    this.assignedTasks[member].push({ ...newTask, id: `${newTask.id}_${member}` });
                });
                
                this.showMessage(`Task assigned to all ${this.members.length} members and synced`, 'success');
            } else {
                if (!this.assignedTasks[assignTo]) this.assignedTasks[assignTo] = [];
                this.assignedTasks[assignTo].push(newTask);
                
                this.showMessage(`Task assigned to ${assignTo} and synced`, 'success');
            }

            // Clear form
            document.getElementById('assignTaskMember').value = '';
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskDeadline').value = '';
            document.querySelectorAll('input[name="taskPriority"]').forEach(radio => {
                radio.checked = false;
            });

            await this.saveDataToFirebase('assignedTasks', this.assignedTasks);
            
        } catch (error) {
            console.error('Assign task failed:', error);
            this.showMessage('Failed to assign task', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    updateRecentAssignedTasks() {
        try {
            const recentTasksList = document.getElementById('recentTasksList');
            if (!recentTasksList) return;

            const allAssignedTasks = [];
            Object.keys(this.assignedTasks).forEach(member => {
                this.assignedTasks[member].forEach(task => {
                    allAssignedTasks.push({ ...task, assignedTo: member });
                });
            });

            allAssignedTasks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const recentTasks = allAssignedTasks.slice(0, 5);

            if (recentTasks.length === 0) {
                recentTasksList.innerHTML = '<div class="no-tasks">No tasks assigned yet</div>';
                return;
            }

            const html = recentTasks.map(task => `
                <div class="recent-task-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin-bottom: 0.75rem; background: white; border-radius: 0.75rem; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm);">
                    <div class="task-info">
                        <div style="font-weight: 600; color: var(--gray-900); margin-bottom: 0.25rem;">${task.title}</div>
                        <div style="font-size: 0.875rem; color: var(--gray-600);">Assigned to: ${task.assignedTo} | Priority: ${task.priority} | Status: ${task.status}</div>
                    </div>
                    <div class="task-status-mini status-${task.status}" style="padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; ${this.getTaskStatusStyle(task.status)}">
                        ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </div>
                </div>
            `).join('');

            recentTasksList.innerHTML = html;

        } catch (error) {
            console.error('Error updating recent assigned tasks:', error);
        }
    }

    getTaskStatusStyle(status) {
        switch(status) {
            case 'completed':
                return 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;';
            case 'in-progress':
                return 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
            case 'blocked':
                return 'background: #fecaca; color: #dc2626; border: 1px solid #fecaca;';
            default:
                return 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;';
        }
    }

    async clearAllData() {
        if (confirm('Clear all data? This action will be synced across all devices and cannot be undone!')) {
            try {
                this.attendance = {};
                this.tasks = {};
                this.ideas = [];
                this.assignedTasks = {};
                
                await this.saveAllDataToFirebase();
                
                this.showMessage('All data cleared and synced across devices', 'success');
                
            } catch (error) {
                console.error('Clear data error:', error);
                this.showMessage('Failed to clear data', 'error');
            }
        }
    }

    logoutAdmin() {
        try {
            this.isAdminLoggedIn = false;
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('adminPassword').value = '';
            this.showMessage('Admin logged out', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // PDF EXPORT FUNCTIONS (All the existing PDF functions remain the same but without emoticons)
    async exportCategoryPDF() {
        console.log('Export PDF clicked');
        
        try {
            const category = document.getElementById('exportCategory')?.value || 'performance-analysis';
            const selectedMember = document.getElementById('individualMemberSelect')?.value;
            
            if (typeof window.jspdf === 'undefined') {
                this.showMessage('PDF library not loaded. Please refresh the page and ensure internet connection', 'error');
                return;
            }
            
            this.generateEnhancedPDF(category, selectedMember);
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showMessage('PDF export failed. Please try again', 'error');
        }
    }

    generateEnhancedPDF(category, selectedMember) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const margin = 15;
        let y = margin;
        
        // PDF Header with sync status
        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229);
        doc.text('AI T19 Team Management Report', margin, y);
        y += 15;
        
        // Date and System Info
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
        y += 5;
        doc.text(`Firebase Status: ${this.isOnline ? 'REAL-TIME ACTIVE' : 'OFFLINE MODE'}`, margin, y);
        y += 5;
        if (this.lastSyncTime) {
            doc.text(`Last Sync: ${this.lastSyncTime.toLocaleString()}`, margin, y);
            y += 5;
        }
        y += 5;
        
        switch(category) {
            case 'complete-team-report':
                this.generateCompleteTeamPDF(doc, margin, y);
                break;
            case 'individual-member-report':
                if (selectedMember && this.members.includes(selectedMember)) {
                    this.generateIndividualMemberPDF(doc, margin, y, selectedMember);
                } else {
                    this.showMessage('Please select a member for individual report', 'error');
                    return;
                }
                break;
            case 'performance-analysis':
                this.generatePerformanceAnalysisPDF(doc, margin, y);
                break;
            default:
                this.generatePerformanceAnalysisPDF(doc, margin, y);
                break;
        }
        
        // Save PDF
        const filename = `AI_T19_${category}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        this.showMessage('PDF exported successfully with real-time data', 'success');
    }

    generateCompleteTeamPDF(doc, margin, startY) {
        let y = startY;
        
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text('Team Overview', margin, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const totalTasks = this.calculateTotalTasks();
        const avgAttendance = this.calculateAvgAttendance();
        
        doc.text(`Total Members: ${this.members.length}`, margin, y); y += 6;
        doc.text(`Total Tasks: ${totalTasks}`, margin, y); y += 6;
        doc.text(`Total Ideas: ${this.ideas.length}`, margin, y); y += 6;
        doc.text(`Average Attendance: ${avgAttendance}%`, margin, y); y += 15;
        
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text('Performance Rankings', margin, y);
        y += 10;
        
        const rankings = this.calculateAllMembersPerformance();
        const tableColumns = ['Rank', 'Member Name', 'Score', 'Attendance', 'Tasks', 'Ideas'];
        const tableRows = rankings.map((member, index) => [
            index + 1,
            member.name,
            `${member.score}%`,
            `${member.attendanceRate}%`,
            member.taskCount || 0,
            member.ideaCount || 0
        ]);
        
        if (doc.autoTable) {
            doc.autoTable({
                startY: y,
                head: [tableColumns],
                body: tableRows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [79, 70, 229],
                    textColor: [255, 255, 255],
                    fontSize: 10
                },
                styles: { fontSize: 9 },
                margin: { left: margin, right: margin }
            });
        }
    }

    generateIndividualMemberPDF(doc, margin, startY, memberName) {
        let y = startY;
        
        doc.setFontSize(16);
        doc.setTextColor(79, 70, 229);
        doc.text(`Individual Report: ${memberName}`, margin, y);
        y += 15;
        
        const performance = this.calculateMemberPerformance(memberName);
        const memberTasks = this.tasks[memberName] || [];
        const memberAssignedTasks = this.assignedTasks[memberName] || [];
        const memberIdeas = this.ideas.filter(idea => idea.member === memberName);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Performance Summary:', margin, y); y += 10;
        
        doc.setFontSize(10);
        doc.text(`Overall Score: ${performance.score}%`, margin, y); y += 6;
        doc.text(`Attendance Rate: ${performance.attendanceRate}%`, margin, y); y += 6;
        doc.text(`Total Tasks: ${performance.taskCount}`, margin, y); y += 6;
        doc.text(`Ideas Shared: ${performance.ideaCount}`, margin, y); y += 6;
        doc.text(`Active Days: ${performance.activeDays}`, margin, y); y += 15;
        
        if (memberTasks.length > 0 || memberAssignedTasks.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(79, 70, 229);
            doc.text('Task Details:', margin, y); y += 8;
            
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            
            if (memberTasks.length > 0) {
                doc.text('Regular Tasks:', margin, y); y += 5;
                memberTasks.slice(0, 10).forEach((task, index) => {
                    const status = task.status || 'pending';
                    const description = task.description || task;
                    doc.text(`${index + 1}. [${status.toUpperCase()}] ${description.substring(0, 60)}...`, margin + 5, y);
                    y += 4;
                });
                y += 3;
            }
            
            if (memberAssignedTasks.length > 0) {
                doc.text('Assigned Tasks:', margin, y); y += 5;
                memberAssignedTasks.slice(0, 10).forEach((task, index) => {
                    const status = task.status || 'pending';
                    doc.text(`${index + 1}. [${status.toUpperCase()}] ${task.title}`, margin + 5, y);
                    y += 4;
                });
            }
        }
        
        if (memberIdeas.length > 0) {
            y += 5;
            doc.setFontSize(12);
            doc.setTextColor(79, 70, 229);
            doc.text('Recent Ideas:', margin, y); y += 8;
            
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            memberIdeas.slice(0, 5).forEach((idea, index) => {
                doc.text(`${index + 1}. ${idea.content.substring(0, 70)}...`, margin + 5, y);
                y += 4;
            });
        }
    }

    generatePerformanceAnalysisPDF(doc, margin, startY) {
        let y = startY;
        
        doc.setFontSize(16);
        doc.setTextColor(79, 70, 229);
        doc.text('Detailed Performance Analysis', margin, y);
        y += 15;
        
        const totalTasks = this.calculateTotalTasks();
        const avgAttendance = this.calculateAvgAttendance();
        const rankings = this.calculateAllMembersPerformance();
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Team Statistics:', margin, y); y += 10;
        
        doc.setFontSize(10);
        doc.text(`Team Size: ${this.members.length} members`, margin, y); y += 6;
        doc.text(`Total Tasks: ${totalTasks}`, margin, y); y += 6;
        doc.text(`Ideas Generated: ${this.ideas.length}`, margin, y); y += 6;
        doc.text(`Average Attendance: ${avgAttendance}%`, margin, y); y += 6;
        doc.text(`Activity Days: ${Object.keys(this.attendance).length}`, margin, y); y += 15;
        
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text('Top Performers:', margin, y); y += 8;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        rankings.slice(0, 5).forEach((member, index) => {
            doc.text(`${index + 1}. ${member.name} - Score: ${member.score}%`, margin, y);
            y += 6;
        });
        
        y += 10;
        
        if (doc.autoTable) {
            doc.setFontSize(12);
            doc.setTextColor(79, 70, 229);
            doc.text('Complete Rankings:', margin, y);
            y += 5;
            
            const tableColumns = ['Rank', 'Member', 'Score', 'Attendance', 'Tasks', 'Ideas', 'Grade'];
            const tableRows = rankings.map((member, index) => [
                index + 1,
                member.name,
                `${member.score}%`,
                `${member.attendanceRate}%`,
                member.taskCount || 0,
                member.ideaCount || 0,
                this.getPerformanceGrade(member.score)
            ]);
            
            doc.autoTable({
                startY: y,
                head: [tableColumns],
                body: tableRows,
                theme: 'striped',
                headStyles: { 
                    fillColor: [79, 70, 229],
                    textColor: [255, 255, 255],
                    fontSize: 10
                },
                styles: { fontSize: 9 },
                margin: { left: margin, right: margin }
            });
        }
    }

    generateIndividualReport(memberName) {
        console.log(`Generating individual report for: ${memberName}`);
        
        try {
            const memberSelect = document.getElementById('individualMemberSelect');
            if (memberSelect) {
                memberSelect.value = memberName;
            }
            
            const categorySelect = document.getElementById('exportCategory');
            if (categorySelect) {
                categorySelect.value = 'individual-member-report';
            }
            
            this.generateEnhancedPDF('individual-member-report', memberName);
            
        } catch (error) {
            console.error('Individual report error:', error);
            this.showMessage('Failed to generate individual report', 'error');
        }
    }

    exportTopPerformerReport() {
        console.log('Exporting top performer report');
        
        try {
            const rankings = this.calculateAllMembersPerformance();
            const topPerformer = rankings[0];
            if (topPerformer) {
                this.generateIndividualReport(topPerformer.name);
            } else {
                this.showMessage('No performance data available', 'error');
            }
        } catch (error) {
            console.error('Export top performer error:', error);
            this.showMessage('Failed to export top performer report', 'error');
        }
    }

    getPerformanceGrade(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Improving';
        return 'Needs Focus';
    }

    // HELPER FUNCTIONS
    calculateAllMembersPerformance() {
        try {
            return this.members.map(member => {
                const attendanceRate = this.calculateMemberAttendanceRate(member);
                const ideaCount = this.ideas.filter(idea => idea.member === member).length;
                const taskCount = this.calculateMemberTaskCount(member);
                const activeDays = this.calculateMemberActiveDays(member);
                
                const attendanceScore = attendanceRate * 0.4;
                const ideaScore = Math.min(ideaCount * 8, 32);
                const taskScore = Math.min(taskCount * 4, 20);
                const activityScore = Math.min(activeDays * 2, 8);
                
                const score = Math.round(attendanceScore + ideaScore + taskScore + activityScore);
                
                return {
                    name: member,
                    attendanceRate,
                    ideaCount,
                    taskCount,
                    activeDays,
                    score: Math.max(0, Math.min(100, score))
                };
            }).sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error('Error calculating member performance:', error);
            return this.members.map(member => ({
                name: member,
                attendanceRate: 0,
                ideaCount: 0,
                taskCount: 0,
                activeDays: 0,
                score: 0
            }));
        }
    }

    calculateMemberPerformance(memberName) {
        try {
            const attendanceRate = this.calculateMemberAttendanceRate(memberName);
            const ideaCount = this.ideas.filter(idea => idea.member === memberName).length;
            const taskCount = this.calculateMemberTaskCount(memberName);
            const activeDays = this.calculateMemberActiveDays(memberName);
            
            const attendanceScore = attendanceRate * 0.4;
            const ideaScore = Math.min(ideaCount * 8, 32);
            const taskScore = Math.min(taskCount * 4, 20);
            const activityScore = Math.min(activeDays * 2, 8);
            
            const score = Math.round(attendanceScore + ideaScore + taskScore + activityScore);
            
            return {
                attendanceRate,
                ideaCount,
                taskCount,
                activeDays,
                score: Math.max(0, Math.min(100, score))
            };
        } catch (error) {
            console.error('Error calculating member performance:', error);
            return { attendanceRate: 0, ideaCount: 0, taskCount: 0, activeDays: 0, score: 0 };
        }
    }

    calculateMemberAttendanceRate(member) {
        try {
            const attendanceDays = Object.keys(this.attendance);
            if (attendanceDays.length === 0) return 0;
            
            let presentDays = 0;
            attendanceDays.forEach(date => {
                if (this.attendance[date] && this.attendance[date][member] === 'present') {
                    presentDays++;
                }
            });
            
            return Math.round((presentDays / attendanceDays.length) * 100);
        } catch (error) {
            console.error('Error calculating attendance rate:', error);
            return 0;
        }
    }

    calculateMemberTaskCount(member) {
        try {
            const regularTasks = this.tasks[member] ? this.tasks[member].length : 0;
            const assignedTasks = this.assignedTasks[member] ? this.assignedTasks[member].length : 0;
            return regularTasks + assignedTasks;
        } catch (error) {
            console.error('Error calculating task count:', error);
            return 0;
        }
    }

    calculateMemberActiveDays(member) {
        try {
            const attendanceDays = Object.keys(this.attendance);
            return attendanceDays.filter(date => 
                this.attendance[date] && this.attendance[date][member] === 'present'
            ).length;
        } catch (error) {
            console.error('Error calculating active days:', error);
            return 0;
        }
    }

    calculateTotalTasks() {
        try {
            const regularTasks = Object.values(this.tasks).reduce((total, memberTasks) => total + (memberTasks?.length || 0), 0);
            const assignedTasksCount = Object.values(this.assignedTasks).reduce((total, memberTasks) => total + (memberTasks?.length || 0), 0);
            return regularTasks + assignedTasksCount;
        } catch (error) {
            console.error('Error calculating total tasks:', error);
            return 0;
        }
    }

    calculateAvgAttendance() {
        try {
            const dates = Object.keys(this.attendance);
            if (dates.length === 0) return 0;

            let totalRate = 0;
            dates.forEach(date => {
                const dayData = this.attendance[date];
                const presentCount = Object.values(dayData).filter(status => status === 'present').length;
                const totalCount = Object.keys(dayData).length;
                if (totalCount > 0) {
                    totalRate += (presentCount / totalCount) * 100;
                }
            });

            return Math.round(totalRate / dates.length);
        } catch (error) {
            console.error('Error calculating average attendance:', error);
            return 0;
        }
    }

    // EVENT LISTENERS SETUP
    setupEventListeners() {
        try {
            console.log('Setting up enhanced event listeners...');
            
            const navTabs = document.querySelector('.nav-tabs');
            if (navTabs) {
                navTabs.addEventListener('click', (e) => {
                    if (e.target.closest('.nav-tab')) {
                        const tab = e.target.closest('.nav-tab');
                        this.switchTab(tab.dataset.tab);
                    }
                });
            }

            const buttonHandlers = {
                'markAttendanceBtn': () => this.markAttendance(),
                'loadTasksBtn': () => this.loadMemberTasks(),
                'addNewTaskBtn': () => this.addNewTask(),
                'addIdeaBtn': () => this.addIdea(),
                'toggleActivityBtn': () => this.toggleActivityFeed(),
                'performanceReportBtn': () => this.showPerformanceReport(),
                'previewReportBtn': () => this.previewReport(),
                'exportDataBtn': () => this.exportData(),
                'exportCategoryPdfBtn': () => this.exportCategoryPDF(),
                'adminLoginBtn': () => this.adminLogin(),
                'addMemberBtn': () => this.addMember(),
                'assignTaskBtn': () => this.assignTask(),
                'clearDataBtn': () => this.clearAllData(),
                'logoutAdminBtn': () => this.logoutAdmin()
            };

            Object.entries(buttonHandlers).forEach(([id, handler]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log(`Button clicked: ${id}`);
                        handler();
                    });
                    console.log(`Event listener attached to: ${id}`);
                } else {
                    console.warn(`Element not found: ${id}`);
                }
            });

            const radioGroup = document.querySelector('.radio-group');
            if (radioGroup) {
                radioGroup.addEventListener('click', (e) => {
                    if (e.target.closest('.radio-option')) {
                        const option = e.target.closest('.radio-option');
                        const radio = option.querySelector('input[type="radio"]');
                        if (radio) {
                            radio.checked = true;
                            this.updateRadioStyles();
                        }
                    }
                });
            }

            console.log('Enhanced event listeners setup completed');
            
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    // UI UPDATE METHODS - NO OVERLAPPING
    updateSyncStatus(status) {
        try {
            const syncText = document.getElementById('syncText');
            
            if (syncText) {
                syncText.textContent = status;
            }
            
            // Update header opacity based on connection
            const header = document.querySelector('.header-controls');
            if (header) {
                header.style.opacity = this.isOnline ? '1' : '0.8';
            }
            
        } catch (error) {
            console.error('Sync status update error:', error);
        }
    }

    populateAllSelects() {
        try {
            const selects = [
                'attendanceMember', 'ideaMember', 'assignTaskMember', 'taskMemberSelect', 'individualMemberSelect'
            ];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    const currentValue = select.value;
                    
                    let html = '<option value="">Choose a member...</option>';
                    
                    if (selectId === 'assignTaskMember') {
                        html += '<option value="all">All Members</option>';
                    }
                    
                    this.members.forEach(member => {
                        html += `<option value="${member}">${member}</option>`;
                    });
                    
                    select.innerHTML = html;
                    
                    if (currentValue && (this.members.includes(currentValue) || currentValue === 'all')) {
                        select.value = currentValue;
                    }
                }
            });
        } catch (error) {
            console.error('Error populating selects:', error);
        }
    }

    updateAllDisplays() {
        try {
            this.updateAttendanceDisplay();
            this.updateIdeasDisplay();
            this.updateOverviewStats();
            if (this.isAdminLoggedIn) {
                this.updateAdminMembersList();
                this.updateRecentAssignedTasks();
            }
        } catch (error) {
            console.error('Error updating all displays:', error);
        }
    }

    updateOverviewStats() {
        try {
            const totalTasks = this.calculateTotalTasks();
            const avgAttendance = this.calculateAvgAttendance();
            
            const stats = [
                ['totalTasks', totalTasks],
                ['totalIdeas', this.ideas.length],
                ['avgAttendance', avgAttendance + '%'],
                ['activeDays', Object.keys(this.attendance).length]
            ];
            
            stats.forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });

            // Update admin quick stats
            const adminStats = [
                ['totalMembersCount', this.members.length],
                ['totalTasksCount', totalTasks],
                ['totalIdeasCount', this.ideas.length]
            ];

            adminStats.forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
        } catch (error) {
            console.error('Error updating overview stats:', error);
        }
    }

    updateRadioStyles() {
        try {
            document.querySelectorAll('.radio-option').forEach(option => {
                const radio = option.querySelector('input[type="radio"]');
                option.classList.toggle('selected', radio && radio.checked);
            });
        } catch (error) {
            console.error('Error updating radio styles:', error);
        }
    }

    switchTab(tabName) {
        try {
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            const targetTab = document.getElementById(tabName);
            const targetNavTab = document.querySelector(`[data-tab="${tabName}"]`);
            
            if (targetTab) targetTab.classList.add('active');
            if (targetNavTab) targetNavTab.classList.add('active');

            this.updateAllDisplays();
        } catch (error) {
            console.error('Error switching tabs:', error);
        }
    }

    setTodayDate() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const sessionDate = document.getElementById('sessionDate');
            if (sessionDate) sessionDate.value = today;
        } catch (error) {
            console.error('Error setting today date:', error);
        }
    }

    // UTILITY METHODS
    showMessage(message, type = 'success') {
        try {
            console.log(`Message: ${message} (${type})`);
            
            let container = document.getElementById('messageContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'messageContainer';
                container.style.cssText = 'position: fixed; top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
                document.body.appendChild(container);
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
                ${message}
            `;
            
            container.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 4000);
        } catch (error) {
            console.error('Error showing message:', error);
        }
    }

    saveLocalData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save ${key} locally:`, error);
        }
    }

    loadLocalData() {
        try {
            const keys = ['members', 'memberDetails', 'attendance', 'tasks', 'ideas', 'assignedTasks'];
            keys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (key === 'members' && Array.isArray(parsedData)) {
                        this.members = parsedData;
                    } else if (key === 'ideas' && Array.isArray(parsedData)) {
                        this.ideas = parsedData;
                    } else {
                        this[key] = parsedData;
                    }
                }
            });
        } catch (error) {
            console.error('Failed to load local data:', error);
        }
    }
}

// SAFE INITIALIZATION - NO OVERLAPPING STATUS INDICATORS
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM Content Loaded - Initializing Modern Team Manager...');
        
        // Safety check for Firebase
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            alert('Firebase SDK failed to load. Please refresh the page and check your internet connection.');
            return;
        }
        
        // Safety check for jsPDF
        if (typeof window.jspdf === 'undefined') {
            console.warn('jsPDF library not loaded - PDF export will be limited');
        } else {
            console.log('jsPDF library detected - PDF export ready');
        }
        
        // Initialize team manager safely
        if (!window.teamManager) {
            window.teamManager = new CompleteTeamManager();
            console.log('Team Manager initialized successfully');
        } else {
            console.log('Team Manager already exists');
        }
        
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
    } catch (error) {
        console.error('System initialization failed:', error);
        alert('System failed to start. Please refresh the page.');
    }
});

console.log('AI T19 Enhanced Team Management System - Modern Professional Version Ready');

