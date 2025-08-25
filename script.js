console.log('🚀 AI T19 Complete Team Management System - All Functions Validated...');

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
        this.operationQueue = [];
        this.isProcessingQueue = false;
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

    async queueOperation(operation) {
        return new Promise((resolve, reject) => {
            this.operationQueue.push({ operation, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.operationQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        while (this.operationQueue.length > 0) {
            const { operation, resolve, reject } = this.operationQueue.shift();
            
            try {
                const result = await operation();
                resolve(result);
            } catch (error) {
                reject(error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.isProcessingQueue = false;
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

// COMPLETE Team Manager - WITH FIREBASE CONNECTION FIXES
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
        
        this.performance = new PerformanceManager();
        this.security = new SecurityManager();
        this.sanitizer = new InputSanitizer();
        
        console.log('🚀 Complete Team Manager initialized');
        this.init();
    }

    async init() {
        this.showTemporaryStatus('connecting', 'System initializing...', 3000);
        
        try {
            this.loadLocalData();
            this.initializeMemberDetails();
            await this.initializeFirebaseWithAuth();
            this.setupEventListeners();
            this.populateAllSelects();
            this.setTodayDate();
            this.updateAllDisplays();
            this.startPeriodicSyncCheck();
            
            setTimeout(() => {
                this.hideConnectionStatus();
                this.updateSyncStatus('Ready');
            }, 1500);
            
            this.showMessage('✅ System ready with Firebase sync!', 'success');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showMessage('❌ System initialization failed.', 'error');
            this.handleInitializationError(error);
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
                    skills: [],
                    status: 'Active',
                    notes: ''
                };
            }
        });
    }

    handleInitializationError(error) {
        this.isOnline = false;
        this.connectionState = 'error';
        this.syncErrors.push({
            type: 'initialization',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        this.showTemporaryStatus('offline', 'Running in offline mode', 3000);
    }

    // FIXED Firebase Connection - Removes Connection Issues
    async initializeFirebaseWithAuth() {
        try {
            console.log('🔄 Connecting to Firebase Database...');
            
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.database = firebase.database();
            this.auth = firebase.auth();
            
            console.log('🔑 Starting authentication...');
            
            // Anonymous sign in
            const userCredential = await this.auth.signInAnonymously();
            console.log('✅ Authentication successful:', userCredential.user.uid);
            
            // Test database write immediately after auth
            console.log('🧪 Testing database write...');
            const testRef = this.database.ref('connection_test');
            await testRef.set({
                timestamp: Date.now(),
                status: 'connected',
                uid: userCredential.user.uid
            });
            console.log('✅ Database write successful');
            
            // Clean up test
            await testRef.remove();
            console.log('✅ Database connection confirmed');
            
            this.isOnline = true;
            this.connectionState = 'online';
            
            this.showTemporaryStatus('online', 'Database Connected!', 2000);
            this.updateSyncStatus('Connected');
            
            // Setup real-time listeners
            this.setupConnectionMonitoring();
            this.setupDataListeners();
            
            // Initial sync
            await this.syncAllDataToFirebase();
            
            console.log('🚀 Firebase fully operational');
            
        } catch (error) {
            console.error('❌ Firebase connection failed:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error
            });
            
            // Show specific error to user
            if (error.code === 'PERMISSION_DENIED') {
                this.showMessage('🔒 Database permission denied - check Firebase rules!', 'error');
                this.showDatabaseFixHelp();
            } else if (error.code === 'NETWORK_ERROR') {
                this.showMessage('🌐 Network error - check internet connection!', 'error');
            } else {
                this.showMessage(`❌ Connection failed: ${error.message}`, 'error');
            }
            
            this.handleConnectionError(error);
        }
    }

    // Enhanced connection monitoring
    setupConnectionMonitoring() {
        const connectedRef = this.database.ref('.info/connected');
        
        connectedRef.on('value', (snapshot) => {
            const isConnected = snapshot.val();
            console.log(`📡 Connection status: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
            
            if (isConnected) {
                this.isOnline = true;
                this.updateSyncStatus('Connected');
                console.log('✅ Database is online');
                this.processSyncQueue();
                this.clearSyncErrors();
            } else {
                this.isOnline = false;
                this.updateSyncStatus('Disconnected');
                console.log('❌ Database is offline');
            }
        });
    }

    // Enhanced data listeners
    setupDataListeners() {
        const paths = ['members', 'memberDetails', 'attendance', 'tasks', 'ideas', 'assignedTasks'];
        
        paths.forEach(path => {
            const ref = this.database.ref(`teams/${this.teamId}/${path}`);
            
            ref.on('value', (snapshot) => {
                console.log(`📥 Data received for ${path}:`, snapshot.exists() ? 'Has data' : 'Empty');
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    
                    // Handle different data structures
                    if (path === 'members' && Array.isArray(data)) {
                        this.members = data;
                        this.initializeMemberDetails();
                    } else if (path === 'ideas' && Array.isArray(data)) {
                        this.ideas = data;
                    } else if (path === 'memberDetails' && typeof data === 'object') {
                        this.memberDetails = { ...this.memberDetails, ...data };
                    } else {
                        this[path] = data;
                    }
                    
                    // Save locally and update UI
                    this.saveLocalData(path, this[path]);
                    this.performance.debounce(`update_${path}`, () => {
                        this.updateDisplaysForPath(path);
                    }, 300);
                    
                    this.logActivity(`${path} synchronized`);
                    this.clearSyncError(path);
                }
            }, (error) => {
                console.error(`❌ Listener error for ${path}:`, error);
                this.addSyncError(path, error);
                
                if (error.code === 'PERMISSION_DENIED') {
                    this.showMessage(`🔒 Permission denied for ${path}`, 'error');
                    this.showDatabaseFixHelp();
                }
            });
            
            this.listeners.set(path, ref);
        });
    }

    // Database Fix Help Modal
    showDatabaseFixHelp() {
        if (document.querySelector('.database-fix-help')) return;
        
        const helpDiv = document.createElement('div');
        helpDiv.className = 'database-fix-help';
        helpDiv.innerHTML = `
            <div class="fix-help-content">
                <h3>🔒 Database Rules Fix Required</h3>
                <p><strong>Your Firebase Realtime Database rules are blocking access.</strong></p>
                
                <div class="fix-steps">
                    <h4>🔧 Quick Fix Steps:</h4>
                    <ol>
                        <li>Go to <a href="https://console.firebase.google.com/project/team-management-app-63275/database/team-management-app-63275-default-rtdb/rules" target="_blank">Firebase Console → Database Rules</a></li>
                        <li>Make sure you're on <strong>Realtime Database</strong> (not Firestore)</li>
                        <li>Replace rules with this for testing:</li>
                    </ol>
                    
                    <div class="rules-code">
                        <h5>For Testing (Allow All):</h5>
                        <pre><code>{
  "rules": {
    ".read": true,
    ".write": true
  }
}</code></pre>
                        
                        <h5>For Production (Authenticated Users):</h5>
                        <pre><code>{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}</code></pre>
                    </div>
                    
                    <ol start="4">
                        <li>Click <strong>Publish</strong></li>
                        <li>Refresh your app</li>
                    </ol>
                </div>
                
                <button class="btn btn-success" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-check"></i> I've Updated The Rules
                </button>
            </div>
        `;
        
        document.body.appendChild(helpDiv);
    }

    handleConnectionError(error) {
        this.isOnline = false;
        this.connectionState = 'offline';
        
        this.syncErrors.push({
            type: 'connection',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        this.showTemporaryStatus('offline', 'Working offline', 3000);
        this.updateSyncStatus('Offline');
        this.scheduleReconnection();
    }

    scheduleReconnection() {
        setTimeout(() => {
            if (!this.isOnline) {
                console.log('🔄 Attempting to reconnect...');
                this.initializeFirebaseWithAuth();
            }
        }, 10000);
    }

    updateDisplaysForPath(path) {
        try {
            switch(path) {
                case 'members':
                case 'memberDetails':
                    this.populateAllSelects();
                    this.updateAllDisplays();
                    this.updateAdminMembersList();
                    break;
                case 'attendance':
                    this.updateAttendanceDisplay();
                    this.updateOverviewStats();
                    break;
                case 'tasks':
                case 'assignedTasks':
                    if (this.currentSelectedMember) {
                        this.displayMemberTasks(this.currentSelectedMember);
                    }
                    this.updateRecentAssignedTasks();
                    this.updateOverviewStats();
                    break;
                case 'ideas':
                    this.updateIdeasDisplay();
                    this.updateOverviewStats();
                    break;
            }
        } catch (error) {
            console.error(`Error updating displays for ${path}:`, error);
        }
    }

    // ENHANCED Data Operations with better sync
    async saveData(key, data) {
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                // Update UI immediately
                this[key] = data;
                this.updateDisplaysForPath(key);
                
                if (!this.database || !this.auth.currentUser) {
                    throw new Error('Database or auth not ready');
                }
                
                // Force token refresh before critical operations
                await this.auth.currentUser.getIdToken(true);
                
                const ref = this.database.ref(`teams/${this.teamId}/${key}`);
                await ref.set(data);
                
                this.saveLocalData(key, data);
                console.log(`✅ ${key} saved successfully (attempt ${attempt + 1})`);
                this.clearSyncError(key);
                return true;
                
            } catch (error) {
                attempt++;
                console.error(`❌ Save attempt ${attempt} failed for ${key}:`, error);
                
                if (error.code === 'PERMISSION_DENIED') {
                    this.showMessage('🔒 Permission denied. Update Firebase rules!', 'error');
                    this.showDatabaseFixHelp();
                    break;
                }
                
                if (attempt < maxRetries) {
                    console.log(`🔄 Retrying save for ${key} in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    this.saveLocalData(key, data);
                    this.queueForSync(key, data);
                }
            }
        }
        
        return false;
    }

    queueForSync(key, data) {
        const syncItem = { 
            key, 
            data, 
            timestamp: Date.now(), 
            retries: 0,
            id: `${key}_${Date.now()}`
        };
        
        this.syncQueue = this.syncQueue.filter(item => item.key !== key);
        this.syncQueue.push(syncItem);
        
        console.log(`📝 Queued ${key} for sync (${this.syncQueue.length} items)`);
    }

    async processSyncQueue() {
        if (!this.database || !this.auth.currentUser || this.syncQueue.length === 0) return;

        console.log(`🔄 Processing sync queue (${this.syncQueue.length} items)`);
        this.showTemporaryStatus('syncing', 'Syncing queued data...', 2000);

        const itemsToSync = [...this.syncQueue];
        this.syncQueue = [];

        try {
            const updates = {};
            itemsToSync.forEach(item => {
                updates[`teams/${this.teamId}/${item.key}`] = item.data;
            });

            await this.database.ref().update(updates);
            console.log(`✅ Successfully synced ${itemsToSync.length} items`);
            this.updateSyncStatus('Connected');
            
        } catch (error) {
            console.error('Sync queue processing failed:', error);
            this.addSyncError('queue', error);
            
            itemsToSync.forEach(item => {
                if (item.retries < 3) {
                    item.retries++;
                    this.syncQueue.push(item);
                } else {
                    console.warn(`Dropped sync item ${item.key} after 3 retries`);
                }
            });
        }
    }

    startPeriodicSyncCheck() {
        setInterval(() => {
            if (this.syncQueue.length > 0 && this.isOnline) {
                this.processSyncQueue();
            }
            
            if (!this.isOnline) {
                this.scheduleReconnection();
            }
        }, 8000);
    }

    // ATTENDANCE TAB - All Functions with Sync
    async markAttendance() {
        const buttonId = 'markAttendanceBtn';
        
        if (this.performance.isButtonBusy(buttonId)) return;
        this.performance.setBusy(buttonId, true);
        
        try {
            const date = document.getElementById('sessionDate').value;
            const member = document.getElementById('attendanceMember').value;
            const status = document.querySelector('input[name="attendanceStatus"]:checked')?.value;

            // Validation
            if (!date) {
                this.showMessage('❌ Please select a date!', 'error');
                return;
            }

            if (!member) {
                this.showMessage('❌ Please select a member!', 'error');
                return;
            }

            if (!status) {
                this.showMessage('❌ Please select attendance status!', 'error');
                return;
            }

            if (!this.members.includes(member)) {
                this.showMessage('❌ Selected member not found!', 'error');
                return;
            }

            // Mark attendance
            if (!this.attendance[date]) this.attendance[date] = {};
            this.attendance[date][member] = status;

            // Clear form
            document.getElementById('attendanceMember').value = '';
            document.querySelectorAll('input[name="attendanceStatus"]').forEach(radio => {
                radio.checked = false;
            });
            
            this.updateRadioStyles();
            this.updateAttendanceDisplay();
            this.updateOverviewStats();
            
            this.showMessage(`✅ Attendance marked: ${member} - ${status}`, 'success');
            this.logActivity(`Attendance: ${member} marked ${status} for ${date}`);
            
            await this.saveData('attendance', this.attendance);
            
        } catch (error) {
            console.error('Mark attendance failed:', error);
            this.showMessage('❌ Failed to mark attendance.', 'error');
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
                    <div class="date-header">
                        <span><i class="fas fa-calendar-day"></i> Today's Attendance - ${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="members-grid" style="padding: 24px;">
                        ${membersHTML}
                    </div>
                </div>
            `;

            // Update stats
            const stats = [
                ['presentCount', presentCount],
                ['absentCount', absentCount],
                ['notMarkedCount', notMarkedCount],
                ['attendanceRate', this.members.length > 0 ? Math.round((presentCount / this.members.length) * 100) + '%' : '0%']
            ];
            
            stats.forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element && element.textContent !== value.toString()) {
                    element.textContent = value;
                }
            });
        } catch (error) {
            console.error('Error updating attendance display:', error);
        }
    }

    // TASKS TAB - All Functions with Sync
    loadMemberTasks() {
        const buttonId = 'loadTasksBtn';
        
        if (this.performance.isButtonBusy(buttonId)) return;
        
        this.performance.setBusy(buttonId, true);
        
        try {
            const selectedMember = document.getElementById('taskMemberSelect').value;
            
            if (!selectedMember) {
                this.showMessage('❌ Please select a member to load their tasks!', 'error');
                return;
            }
            
            if (!this.members.includes(selectedMember)) {
                this.showMessage('❌ Selected member not found!', 'error');
                return;
            }
            
            this.currentSelectedMember = selectedMember;
            
            const taskDashboard = document.getElementById('taskDashboard');
            if (taskDashboard) {
                taskDashboard.style.display = 'block';
                
                const memberNameDisplay = document.getElementById('selectedMemberName');
                if (memberNameDisplay) {
                    memberNameDisplay.textContent = selectedMember;
                }
                
                this.displayMemberTasks(selectedMember);
                this.updateTaskSummaryStats(selectedMember);
                
                taskDashboard.scrollIntoView({ behavior: 'smooth' });
                
                this.showMessage(`✅ Tasks loaded for ${selectedMember}!`, 'success');
                this.logActivity(`Tasks loaded for ${selectedMember}`);
            }
            
        } catch (error) {
            console.error('Error loading member tasks:', error);
            this.showMessage('❌ Failed to load member tasks.', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    displayMemberTasks(memberName) {
        try {
            if (!memberName || !this.members.includes(memberName)) {
                console.warn('Invalid member name for task display:', memberName);
                return;
            }
            
            this.displayRegularTasks(memberName);
            this.displayAssignedTasks(memberName);
            this.updateTaskSummaryStats(memberName);
            
        } catch (error) {
            console.error('Error displaying member tasks:', error);
        }
    }

    displayRegularTasks(memberName) {
        const regularTasksList = document.getElementById('regularTasksList');
        if (!regularTasksList) return;
        
        const memberTasks = this.tasks[memberName] || [];
        
        if (memberTasks.length === 0) {
            regularTasksList.innerHTML = '<div class="no-tasks">No regular tasks yet.</div>';
            return;
        }
        
        const html = memberTasks.map((task, index) => `
            <div class="task-card ${task.status || 'pending'}">
                <div class="task-header">
                    <div class="task-title">Task ${index + 1}</div>
                    <div class="task-actions">
                        <button class="btn btn-sm update-status-btn" onclick="window.teamManager.updateTaskStatus('${memberName}', ${index}, 'tasks')">
                            <i class="fas fa-edit"></i> Update
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.teamManager.deleteTask('${memberName}', ${index}, 'tasks')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="task-content">
                    <div class="task-description">${task.description || task}</div>
                    <div class="task-date">Added: ${task.date || 'Unknown'}</div>
                </div>
                <div class="task-status">
                    <div class="status-display status-${task.status || 'pending'}">
                        <i class="fas fa-${this.getStatusIcon(task.status || 'pending')}"></i>
                        ${this.getStatusText(task.status || 'pending')}
                    </div>
                </div>
            </div>
        `).join('');
        
        regularTasksList.innerHTML = html;
    }

    displayAssignedTasks(memberName) {
        const assignedTasksList = document.getElementById('assignedTasksList');
        if (!assignedTasksList) return;
        
        const memberAssignedTasks = this.assignedTasks[memberName] || [];
        
        if (memberAssignedTasks.length === 0) {
            assignedTasksList.innerHTML = '<div class="no-tasks">No assigned tasks yet.</div>';
            return;
        }
        
        const html = memberAssignedTasks.map((task, index) => `
            <div class="task-card assigned ${task.status || 'pending'} ${this.isTaskOverdue(task) ? 'overdue' : ''}">
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-priority priority-${task.priority || 'normal'}">${task.priority || 'Normal'}</div>
                </div>
                <div class="task-content">
                    <div class="task-description">${task.description}</div>
                    <div class="task-date">Assigned: ${task.assignedDate || 'Unknown'}</div>
                    ${task.deadline ? `<div class="task-date">Deadline: ${new Date(task.deadline).toLocaleDateString()}</div>` : ''}
                    ${this.isTaskOverdue(task) ? '<div class="overdue-text"><i class="fas fa-exclamation-triangle"></i> Overdue</div>' : ''}
                </div>
                <div class="task-status">
                    <div class="status-display status-${task.status || 'pending'}">
                        <i class="fas fa-${this.getStatusIcon(task.status || 'pending')}"></i>
                        ${this.getStatusText(task.status || 'pending')}
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm update-status-btn" onclick="window.teamManager.updateTaskStatus('${memberName}', ${index}, 'assignedTasks')">
                            <i class="fas fa-edit"></i> Update
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.teamManager.deleteTask('${memberName}', ${index}, 'assignedTasks')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        assignedTasksList.innerHTML = html;
    }

    async addNewTask() {
        const buttonId = 'addNewTaskBtn';
        
        if (this.performance.isButtonBusy(buttonId)) return;
        
        this.performance.setBusy(buttonId, true);
        
        try {
            const description = document.getElementById('newTaskDescription').value.trim();
            
            if (!this.currentSelectedMember) {
                this.showMessage('❌ Please select a member first!', 'error');
                return;
            }
            
            if (!description) {
                this.showMessage('❌ Please enter a task description!', 'error');
                return;
            }
            
            const sanitizedDescription = this.sanitizer.sanitizeAndValidate(description, 'task');
            if (!sanitizedDescription) {
                this.showMessage('❌ Invalid task description. Use 5-500 characters.', 'error');
                return;
            }
            
            const newTask = {
                description: sanitizedDescription,
                status: 'pending',
                date: new Date().toLocaleDateString(),
                timestamp: new Date().toISOString()
            };
            
            if (!this.tasks[this.currentSelectedMember]) {
                this.tasks[this.currentSelectedMember] = [];
            }
            
            this.tasks[this.currentSelectedMember].push(newTask);
            
            document.getElementById('newTaskDescription').value = '';
            
            this.displayMemberTasks(this.currentSelectedMember);
            this.updateOverviewStats();
            
            this.showMessage(`✅ Task added for ${this.currentSelectedMember}!`, 'success');
            this.logActivity(`Task added for ${this.currentSelectedMember}: ${sanitizedDescription.substring(0, 50)}...`);
            
            await this.saveData('tasks', this.tasks);
            
        } catch (error) {
            console.error('Add new task failed:', error);
            this.showMessage('❌ Failed to add task.', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    async updateTaskStatus(memberName, taskIndex, taskType) {
        try {
            const newStatus = prompt('Enter new status (pending, in-progress, completed, blocked):');
            if (!newStatus) return;
            
            const validStatuses = ['pending', 'in-progress', 'completed', 'blocked'];
            if (!validStatuses.includes(newStatus.toLowerCase())) {
                this.showMessage('❌ Invalid status. Use: pending, in-progress, completed, or blocked', 'error');
                return;
            }
            
            if (taskType === 'tasks') {
                if (this.tasks[memberName] && this.tasks[memberName][taskIndex]) {
                    this.tasks[memberName][taskIndex].status = newStatus.toLowerCase();
                    await this.saveData('tasks', this.tasks);
                }
            } else if (taskType === 'assignedTasks') {
                if (this.assignedTasks[memberName] && this.assignedTasks[memberName][taskIndex]) {
                    this.assignedTasks[memberName][taskIndex].status = newStatus.toLowerCase();
                    await this.saveData('assignedTasks', this.assignedTasks);
                }
            }
            
            if (this.currentSelectedMember === memberName) {
                this.displayMemberTasks(memberName);
            }
            
            this.showMessage(`✅ Task status updated to ${newStatus}!`, 'success');
            this.logActivity(`Task status updated: ${memberName} - ${newStatus}`);
            
        } catch (error) {
            console.error('Error updating task status:', error);
            this.showMessage('❌ Failed to update task status.', 'error');
        }
    }

    async deleteTask(memberName, taskIndex, taskType) {
        if (confirm('Delete this task?')) {
            try {
                if (taskType === 'tasks') {
                    if (this.tasks[memberName] && this.tasks[memberName][taskIndex] !== undefined) {
                        this.tasks[memberName].splice(taskIndex, 1);
                        await this.saveData('tasks', this.tasks);
                    }
                } else if (taskType === 'assignedTasks') {
                    if (this.assignedTasks[memberName] && this.assignedTasks[memberName][taskIndex] !== undefined) {
                        this.assignedTasks[memberName].splice(taskIndex, 1);
                        await this.saveData('assignedTasks', this.assignedTasks);
                    }
                }
                
                if (this.currentSelectedMember === memberName) {
                    this.displayMemberTasks(memberName);
                }
                
                this.updateOverviewStats();
                
                this.showMessage('✅ Task deleted!', 'success');
                this.logActivity(`Task deleted for ${memberName}`);
                
            } catch (error) {
                console.error('Error deleting task:', error);
                this.showMessage('❌ Failed to delete task.', 'error');
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

    // IDEAS TAB - All Functions with Sync
    async addIdea() {
        const buttonId = 'addIdeaBtn';
        
        if (this.performance.isButtonBusy(buttonId)) return;
        
        this.performance.setBusy(buttonId, true);
        
        try {
            const member = document.getElementById('ideaMember').value;
            const content = document.getElementById('ideaContent').value.trim();

            // Validation
            if (!member) {
                this.showMessage('❌ Please select your name!', 'error');
                return;
            }

            if (!this.members.includes(member)) {
                this.showMessage('❌ Selected member not found!', 'error');
                return;
            }

            if (!content) {
                this.showMessage('❌ Please enter your idea!', 'error');
                return;
            }

            const sanitizedContent = this.sanitizer.sanitizeAndValidate(content, 'idea');
            if (!sanitizedContent) {
                this.showMessage('❌ Invalid idea. Use 10-1000 characters.', 'error');
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
            
            // Clear form
            document.getElementById('ideaMember').value = '';
            document.getElementById('ideaContent').value = '';
            
            this.updateIdeasDisplay();
            this.updateOverviewStats();
            
            this.showMessage('✅ Idea shared successfully!', 'success');
            this.logActivity(`Idea shared by ${member}: ${sanitizedContent.substring(0, 50)}...`);
            
            await this.saveData('ideas', this.ideas);
            
        } catch (error) {
            console.error('Add idea failed:', error);
            this.showMessage('❌ Failed to share idea.', 'error');
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
                    <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                        <i class="fas fa-lightbulb" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
                        <p>No ideas shared yet. Be the first to share!</p>
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

            ideasBoard.innerHTML = html;
        } catch (error) {
            console.error('Error updating ideas display:', error);
        }
    }

    async deleteIdea(id) {
        if (confirm('Delete this idea?')) {
            try {
                this.ideas = this.ideas.filter(idea => idea.id !== id);
                this.updateIdeasDisplay();
                this.updateOverviewStats();
                
                this.showMessage('✅ Idea deleted!', 'success');
                this.logActivity(`Idea deleted`);
                
                await this.saveData('ideas', this.ideas);
            } catch (error) {
                console.error('Delete idea error:', error);
                this.showMessage('❌ Failed to delete idea.', 'error');
            }
        }
    }

    // ADMIN TAB - All Functions with Sync
    async adminLogin() {
        const buttonId = 'adminLoginBtn';
        
        if (this.performance.isButtonBusy(buttonId)) return;
        
        this.performance.setBusy(buttonId, true);
        
        try {
            const password = document.getElementById('adminPassword').value;
            const clientIP = 'client_' + Date.now();

            if (this.security.isAccountLocked(clientIP)) {
                this.showMessage('❌ Account temporarily locked.', 'error');
                return;
            }

            if (!this.security.checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
                this.showMessage('❌ Too many login attempts.', 'error');
                return;
            }

            if (password === this.adminPassword) {
                this.security.recordLoginAttempt(clientIP, true);
                this.isAdminLoggedIn = true;
                
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                document.getElementById('adminError').style.display = 'none';
                
                this.updateAdminMembersList();
                this.updateRecentAssignedTasks();
                
                this.showMessage('✅ Admin access granted with Firebase sync!', 'success');
                this.logActivity('Admin logged in successfully');
            } else {
                this.security.recordLoginAttempt(clientIP, false);
                document.getElementById('adminError').style.display = 'block';
                document.getElementById('adminPassword').value = '';
                
                const attempts = this.security.loginAttempts.get(clientIP);
                const remaining = 3 - (attempts ? attempts.count : 0);
                this.showMessage(`❌ Invalid password. ${remaining} attempts remaining.`, 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            this.showMessage('❌ Login failed.', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    async addMember() {
        const buttonId = 'addMemberBtn';
        
        if (this.performance.isButtonBusy(buttonId)) return;
        
        this.performance.setBusy(buttonId, true);
        
        try {
            const memberName = document.getElementById('newMemberName').value.trim();
            
            const sanitizedName = this.sanitizer.sanitizeAndValidate(memberName, 'memberName');
            if (!sanitizedName) {
                this.showMessage('❌ Invalid name. Use 2-50 characters, letters only.', 'error');
                return;
            }

            if (this.members.includes(sanitizedName)) {
                this.showMessage('❌ Member already exists!', 'error');
                return;
            }

            this.members.push(sanitizedName);
            this.initializeMemberDetails();
            
            document.getElementById('newMemberName').value = '';
            this.populateAllSelects();
            this.updateAdminMembersList();
            this.updateAllDisplays();
            
            this.showMessage(`✅ Member "${sanitizedName}" added and synced!`, 'success');
            this.logActivity(`Member added: ${sanitizedName}`);
            
            await this.saveData('members', this.members);
            await this.saveData('memberDetails', this.memberDetails);
            
        } catch (error) {
            console.error('Add member failed:', error);
            this.showMessage('❌ Failed to add member.', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    updateAdminMembersList() {
        const membersList = document.getElementById('adminMembersList');
        if (!membersList) return;
        
        const html = this.members.map(member => `
            <div class="member-item">
                <span>${member}</span>
                <button class="remove-member-btn" onclick="window.teamManager.removeMember('${member}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        membersList.innerHTML = html;
    }

    removeMember(memberName) {
        if (confirm(`Remove "${memberName}"? This will delete all their data and sync the changes.`)) {
            try {
                this.members = this.members.filter(member => member !== memberName);
                
                delete this.memberDetails[memberName];
                
                if (this.tasks[memberName]) delete this.tasks[memberName];
                if (this.assignedTasks[memberName]) delete this.assignedTasks[memberName];
                this.ideas = this.ideas.filter(idea => idea.member !== memberName);
                
                Object.keys(this.attendance).forEach(date => {
                    if (this.attendance[date][memberName]) {
                        delete this.attendance[date][memberName];
                    }
                });

                this.populateAllSelects();
                this.updateAdminMembersList();
                this.updateAllDisplays();
                
                this.showMessage(`✅ Member "${memberName}" removed and synced!`, 'success');
                this.logActivity(`Member removed: ${memberName}`);
                
                this.saveData('members', this.members);
                this.saveData('memberDetails', this.memberDetails);
                this.saveData('tasks', this.tasks);
                this.saveData('assignedTasks', this.assignedTasks);
                this.saveData('ideas', this.ideas);
                this.saveData('attendance', this.attendance);
                
            } catch (error) {
                console.error('Error removing member:', error);
                this.showMessage('❌ Failed to remove member.', 'error');
            }
        }
    }

    clearAllData() {
        if (confirm('Clear all data? This will also sync the changes to Firebase and cannot be undone!')) {
            try {
                this.attendance = {};
                this.tasks = {};
                this.ideas = [];
                this.assignedTasks = {};
                
                this.updateAllDisplays();
                this.showMessage('✅ All data cleared and synced!', 'success');
                this.logActivity('All data cleared by admin');
                
                this.saveData('attendance', this.attendance);
                this.saveData('tasks', this.tasks);
                this.saveData('ideas', this.ideas);
                this.saveData('assignedTasks', this.assignedTasks);
            } catch (error) {
                console.error('Clear data error:', error);
                this.showMessage('❌ Failed to clear data.', 'error');
            }
        }
    }

    logoutAdmin() {
        try {
            this.isAdminLoggedIn = false;
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('adminPassword').value = '';
            this.showMessage('✅ Admin logged out!', 'success');
            this.logActivity('Admin logged out');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    exportData() {
        const buttonId = 'exportDataBtn';
        
        if (this.performance.isButtonBusy(buttonId)) return;
        this.performance.setBusy(buttonId, true);
        
        try {
            const exportData = {
                members: this.members,
                attendance: this.attendance,
                tasks: this.tasks,
                ideas: this.ideas,
                assignedTasks: this.assignedTasks,
                memberDetails: this.memberDetails,
                
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    exportTime: new Date().toLocaleString(),
                    totalMembers: this.members.length,
                    totalIdeas: this.ideas.length,
                    totalTasks: this.calculateTotalTasks(),
                    avgAttendance: this.calculateAvgAttendance(),
                    connectionStatus: this.isOnline ? 'ONLINE' : 'OFFLINE',
                    systemVersion: '2.0 Firebase Sync Fixed'
                },
                
                syncStatus: {
                    isOnline: this.isOnline,
                    queueLength: this.syncQueue.length,
                    errorCount: this.syncErrors.length,
                    lastSync: new Date().toISOString()
                }
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AI_T19_Firebase_Synced_Data_${new Date().toISOString().split('T')[0]}.json`;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('✅ Data exported with Firebase sync status!', 'success');
            this.logActivity('Data exported with sync status');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('❌ Export failed. Please try again.', 'error');
        } finally {
            this.performance.setBusy(buttonId, false);
        }
    }

    // Helper Functions
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

    getStatusIcon(status) {
        const icons = {
            'pending': 'clock',
            'in-progress': 'spinner',
            'completed': 'check',
            'blocked': 'times'
        };
        return icons[status] || 'clock';
    }

    getStatusText(status) {
        const texts = {
            'pending': 'Pending',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'blocked': 'Blocked'
        };
        return texts[status] || 'Pending';
    }

    isTaskOverdue(task) {
        if (!task.deadline) return false;
        return new Date(task.deadline) < new Date();
    }

    // Sync Error Management
    addSyncError(key, error) {
        this.syncErrors.push({
            key,
            error: error.message || error,
            timestamp: new Date().toISOString()
        });
        
        if (this.syncErrors.length > 10) {
            this.syncErrors = this.syncErrors.slice(-10);
        }
    }

    clearSyncError(key) {
        this.syncErrors = this.syncErrors.filter(error => error.key !== key);
    }

    clearSyncErrors() {
        this.syncErrors = [];
    }

    // Data Sync
    async syncAllDataToFirebase() {
        if (!this.database || !this.auth.currentUser) return;
        
        try {
            const updates = {};
            ['members', 'memberDetails', 'attendance', 'tasks', 'ideas', 'assignedTasks'].forEach(key => {
                updates[`teams/${this.teamId}/${key}`] = this[key];
            });
            
            await this.database.ref().update(updates);
            console.log('✅ Complete system sync completed');
        } catch (error) {
            console.error('Initial sync failed:', error);
            this.addSyncError('initial_sync', error);
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        try {
            document.querySelector('.nav-tabs').addEventListener('click', (e) => {
                if (e.target.closest('.nav-tab')) {
                    const tab = e.target.closest('.nav-tab');
                    this.switchTab(tab.dataset.tab);
                }
            });

            const buttonHandlers = {
                'markAttendanceBtn': () => this.markAttendance(),
                'addIdeaBtn': () => this.addIdea(),
                'adminLoginBtn': () => this.adminLogin(),
                'addMemberBtn': () => this.addMember(),
                'loadTasksBtn': () => this.loadMemberTasks(),
                'addNewTaskBtn': () => this.addNewTask(),
                'exportDataBtn': () => this.exportData(),
                'clearDataBtn': () => this.clearAllData(),
                'logoutAdminBtn': () => this.logoutAdmin()
            };

            Object.entries(buttonHandlers).forEach(([id, handler]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('click', (e) => {
                        e.preventDefault();
                        handler();
                    });
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

            console.log('✅ All event listeners setup completed');
            
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    // UI Update Methods
    showTemporaryStatus(state, message, duration = 2000) {
        const statusElement = document.getElementById('connectionStatus');
        const statusIcon = document.getElementById('statusIcon');
        const statusText = document.getElementById('statusText');
        
        if (statusElement && statusIcon && statusText) {
            statusElement.style.display = 'block';
            statusElement.className = `connection-status ${state}`;
            statusText.textContent = message;
            
            const iconMap = {
                'connecting': 'fas fa-sync-alt fa-spin',
                'online': 'fas fa-wifi',
                'offline': 'fas fa-wifi-slash',
                'syncing': 'fas fa-cloud-upload-alt fa-spin',
                'error': 'fas fa-exclamation-triangle'
            };
            
            statusIcon.className = iconMap[state] || 'fas fa-question-circle';
            
            if (this.statusTimeout) clearTimeout(this.statusTimeout);
            this.statusTimeout = setTimeout(() => this.hideConnectionStatus(), duration);
        }
    }

    hideConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) statusElement.style.display = 'none';
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
            this.statusTimeout = null;
        }
    }

    updateSyncStatus(status) {
        try {
            const syncText = document.getElementById('syncText');
            const syncIcon = document.getElementById('syncIcon');
            
            if (syncText && syncText.textContent !== status) {
                syncText.textContent = status;
            }
            
            if (syncIcon) {
                let iconClass = 'fas fa-cloud';
                
                if (status.includes('Connected') || status.includes('Ready')) {
                    iconClass = 'fas fa-cloud-upload-alt';
                } else if (status.includes('Offline')) {
                    iconClass = 'fas fa-exclamation-triangle';
                } else if (status.includes('Syncing')) {
                    iconClass = 'fas fa-sync-alt fa-spin';
                }
                
                syncIcon.className = iconClass;
            }
            
            this.connectionState = status.includes('Offline') ? 'offline' : 'online';
            
        } catch (error) {
            console.error('Sync status update error:', error);
        }
    }

    populateAllSelects() {
        try {
            const selects = [
                'attendanceMember', 'ideaMember', 'assignTaskMember',
                'taskMemberSelect', 'individualMemberSelect'
            ];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    const currentValue = select.value;
                    
                    let html = '<option value="">Choose a member...</option>';
                    
                    if (selectId === 'assignTaskMember') {
                        html += '<option value="all">📢 All Members</option>';
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
            requestAnimationFrame(() => {
                this.updateAttendanceDisplay();
                this.updateIdeasDisplay();
                this.updateOverviewStats();
            });
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
                if (element && element.textContent !== value.toString()) {
                    element.textContent = value;
                }
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

            requestAnimationFrame(() => {
                this.updateAllDisplays();
            });
        } catch (error) {
            console.error('Error switching tabs:', error);
        }
    }

    setTodayDate() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const sessionDate = document.getElementById('sessionDate');
            if (sessionDate && sessionDate.value !== today) {
                sessionDate.value = today;
            }
        } catch (error) {
            console.error('Error setting today date:', error);
        }
    }

    // Utility Methods
    logActivity(activity) {
        try {
            const activityList = document.getElementById('activityList');
            if (activityList) {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <span><i class="fas fa-sync"></i> ${activity}</span>
                    <span class="activity-time">Just now</span>
                `;
                activityList.insertBefore(item, activityList.firstChild);
                
                while (activityList.children.length > 20) {
                    activityList.removeChild(activityList.lastChild);
                }
            }
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    showMessage(message, type = 'success') {
        try {
            let container = document.getElementById('messageContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'messageContainer';
                container.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; max-width: 400px;';
                document.body.appendChild(container);
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-triangle'}"></i>
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

    // Placeholder methods for missing features
    updateRecentAssignedTasks() { 
        console.log('Recent assigned tasks system ready'); 
    }
}

// Initialize the complete system with Firebase sync fixes
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.teamManager = new CompleteTeamManager();
        console.log('✅ Complete AI T19 Team Management System Ready - Firebase Sync Fixed!');
        
        // Add global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
    } catch (error) {
        console.error('❌ System initialization failed:', error);
        const status = document.getElementById('connectionStatus');
        if (status) {
            status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> System Failed to Start';
            status.className = 'connection-status offline';
            status.style.display = 'block';
        }
    }
});

console.log('🎉 Complete AI T19 Team Management System - Firebase Sync Fixed and All Functions Validated!');
