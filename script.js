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

// Fixed Team Manager Class
class TeamManager {
    constructor() {
        this.teamId = 'ai-t19';
        this.members = [
            'Vasantha Kumar N', 'Dheeraj R', 'Gokul T', 'Siva Prasanth K',
            'Sanjay S', 'Rohith Vignesh N', 'Prabhu M', 'Prithivi Raj M',
            'Kamalesh R', 'Ashok Kumar S'
        ];
        this.attendance = {};
        this.tasks = {};
        this.ideas = [];
        this.assignedTasks = {};
        this.currentSelectedMember = null;
        this.isAdminLoggedIn = false;
        this.adminPassword = 'admin123';
        this.isOnline = false;
        this.database = null;
        this.connectionStatusSet = false; // 🔥 FIX: Prevent multiple status updates
        this.listenersSetup = false; // 🔥 FIX: Prevent duplicate listeners
        
        this.init();
    }

    init() {
        console.log('🚀 Starting Fixed Team Manager...');
        this.updateConnectionStatus('🔄 Initializing...', 'connecting');
        
        this.initializeFirebase().then(() => {
            this.setupEventListeners();
            this.populateSelects();
            this.setTodayDate();
            this.loadLocalData();
            this.updateAllDisplays();
            this.showMessage('✅ Team Management System Ready!', 'success');
        }).catch(() => {
            this.updateConnectionStatus('⚠️ Offline Mode', 'offline');
            this.setupEventListeners();
            this.populateSelects();
            this.setTodayDate();
            this.loadLocalData();
            this.updateAllDisplays();
            this.showMessage('⚠️ Working offline. Firebase not connected.', 'warning');
        });
    }

    async initializeFirebase() {
        try {
            firebase.initializeApp(firebaseConfig);
            this.database = firebase.database();
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
                
                // 🔥 FIX: Single connection listener with proper state management
                this.database.ref('.info/connected').on('value', (snapshot) => {
                    clearTimeout(timeout);
                    const connected = snapshot.val();
                    
                    // Only update if status actually changed
                    if (this.isOnline !== connected) {
                        this.isOnline = connected;
                        console.log('🔗 Firebase connection changed:', connected);
                        
                        if (connected) {
                            this.updateConnectionStatus('🟢 Online', 'online');
                            this.setupCompleteFirebaseListeners();
                            this.syncToFirebase();
                        } else {
                            this.updateConnectionStatus('🔴 Offline', 'offline');
                        }
                    }
                    
                    if (!this.connectionStatusSet) {
                        this.connectionStatusSet = true;
                        resolve();
                    }
                });
            });
        } catch (error) {
            throw error;
        }
    }

    // 🔥 FIXED: Proper Firebase Listeners without duplicates
    setupCompleteFirebaseListeners() {
        if (!this.database || this.listenersSetup) return;
        
        console.log('🔧 Setting up Firebase listeners...');
        const teamRef = this.database.ref(`teams/${this.teamId}`);
        
        // 🔥 CRITICAL FIX: Use update() instead of set() in listeners
        teamRef.child('members').on('value', (snapshot) => {
            if (snapshot.exists()) {
                const newMembers = snapshot.val();
                if (JSON.stringify(this.members) !== JSON.stringify(newMembers)) {
                    const oldMembers = [...this.members];
                    this.members = newMembers;
                    console.log('👥 Members updated from Firebase:', this.members);
                    this.onMembersChanged(oldMembers, this.members);
                    this.saveToLocalStorage();
                }
            }
        });

        teamRef.child('tasks').on('value', (snapshot) => {
            if (snapshot.exists()) {
                this.tasks = snapshot.val();
                this.updateTasksDisplay();
                if (this.currentSelectedMember) {
                    this.displayMemberTasks(this.currentSelectedMember);
                }
                this.saveToLocalStorage();
            }
        });

        teamRef.child('assignedTasks').on('value', (snapshot) => {
            if (snapshot.exists()) {
                this.assignedTasks = snapshot.val();
                if (this.currentSelectedMember) {
                    this.displayMemberTasks(this.currentSelectedMember);
                }
                this.saveToLocalStorage();
            }
        });

        teamRef.child('attendance').on('value', (snapshot) => {
            if (snapshot.exists()) {
                this.attendance = snapshot.val();
                this.updateAttendanceDisplay();
                this.saveToLocalStorage();
            }
        });

        teamRef.child('ideas').on('value', (snapshot) => {
            if (snapshot.exists()) {
                this.ideas = Object.values(snapshot.val() || {});
                this.updateIdeasDisplay();
                this.saveToLocalStorage();
            }
        });

        this.listenersSetup = true;
        console.log('✅ Firebase listeners established');
    }

    // 🔥 FIXED: Member change cascade with proper UI sync
    onMembersChanged(oldMembers, newMembers) {
        console.log('🔄 Processing member changes...');
        
        // Temporarily disable listeners to prevent conflicts
        this.pauseUIUpdates = true;
        
        setTimeout(() => {
            this.populateAllSelects();
            this.updateAllDisplays();
            this.updateMemberDependentDisplays();
            
            const removedMembers = oldMembers.filter(member => !newMembers.includes(member));
            if (removedMembers.length > 0) {
                console.log('🧹 Cleaning up data for removed members:', removedMembers);
                this.cleanupRemovedMembersData(removedMembers);
            }
            
            if (this.currentSelectedMember && !newMembers.includes(this.currentSelectedMember)) {
                const dashboard = document.getElementById('taskDashboard');
                if (dashboard) dashboard.style.display = 'none';
                this.currentSelectedMember = null;
                
                const select = document.getElementById('taskMemberSelect');
                if (select) select.value = '';
            }
            
            if (this.isAdminLoggedIn) {
                this.updateMembersList();
            }
            
            this.pauseUIUpdates = false;
            console.log('✅ Member change processing complete');
        }, 100); // Small delay to prevent rapid UI thrashing
    }

    // 🔥 FIXED: Use update() method instead of set() to prevent overwrites
    async saveData(dataType, data) {
        // Save to localStorage first
        localStorage.setItem(dataType, JSON.stringify(data));
        
        if (this.isOnline && this.database) {
            try {
                // 🔥 CRITICAL FIX: Use update() with specific path instead of set()
                const updates = {};
                updates[`teams/${this.teamId}/${dataType}`] = data;
                
                await this.database.ref().update(updates);
                console.log(`✅ ${dataType} updated to Firebase using update() method`);
                
                return true; // Return success
            } catch (error) {
                console.error(`❌ Firebase update error for ${dataType}:`, error);
                this.showMessage(`⚠️ ${dataType} saved locally only (Firebase error)`, 'warning');
                return false; // Return failure
            }
        } else {
            console.log(`📱 ${dataType} saved to localStorage only (offline)`);
            return true; // Still successful locally
        }
    }

    // 🔥 ENHANCED: Add member with proper confirmation
    async addMember() {
        const memberName = document.getElementById('newMemberName').value.trim();
        
        if (!memberName) {
            this.showMessage('Please enter a member name!', 'error');
            return;
        }

        if (this.members.includes(memberName)) {
            this.showMessage('Member already exists!', 'error');
            return;
        }

        console.log('➕ Adding new member:', memberName);
        
        // Create new members array
        const newMembersArray = [...this.members, memberName];
        
        // Save with confirmation
        const success = await this.saveData('members', newMembersArray);
        
        if (success) {
            // Only update local state after successful save
            this.members = newMembersArray;
            document.getElementById('newMemberName').value = '';
            this.showMessage(`✅ Member "${memberName}" added successfully!`, 'success');
            
            // Update UI immediately for better UX
            this.populateAllSelects();
            this.updateMembersList();
        } else {
            this.showMessage(`❌ Failed to add member "${memberName}". Check Firebase connection.`, 'error');
        }
    }

    // 🔥 ENHANCED: Remove member with proper confirmation
    async removeMember(memberName) {
        if (confirm(`Remove "${memberName}"? This will delete all their data across all sections.`)) {
            console.log('🗑️ Removing member:', memberName);
            
            // Create new members array without the removed member
            const newMembersArray = this.members.filter(member => member !== memberName);
            
            // Save with confirmation
            const success = await this.saveData('members', newMembersArray);
            
            if (success) {
                // Only update local state after successful save
                this.members = newMembersArray;
                this.showMessage(`✅ Member "${memberName}" removed successfully!`, 'success');
                
                // Clean up their data
                this.cleanupRemovedMembersData([memberName]);
                
                // Update UI immediately
                this.populateAllSelects();
                this.updateMembersList();
                this.updateAllDisplays();
            } else {
                this.showMessage(`❌ Failed to remove member "${memberName}". Check Firebase connection.`, 'error');
            }
        }
    }

    // 🔥 FIXED: Connection status with single update
    updateConnectionStatus(message, status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement && statusElement.textContent !== message) {
            statusElement.innerHTML = message;
            statusElement.className = `connection-status ${status}`;
            
            // 🔥 FIX: Auto-hide connection status after delay
            if (status === 'online') {
                setTimeout(() => {
                    if (statusElement && statusElement.textContent === message) {
                        statusElement.style.opacity = '0.3';
                        setTimeout(() => {
                            if (statusElement) statusElement.style.display = 'none';
                        }, 2000);
                    }
                }, 3000);
            }
        }
    }

    // Clean up data for removed members
    cleanupRemovedMembersData(removedMembers) {
        let dataChanged = false;

        removedMembers.forEach(member => {
            if (this.tasks[member]) {
                delete this.tasks[member];
                dataChanged = true;
            }
            
            if (this.assignedTasks[member]) {
                delete this.assignedTasks[member];
                dataChanged = true;
            }
            
            Object.keys(this.attendance).forEach(date => {
                if (this.attendance[date][member]) {
                    delete this.attendance[date][member];
                    dataChanged = true;
                }
            });
            
            const originalIdeasLength = this.ideas.length;
            this.ideas = this.ideas.filter(idea => idea.member !== member);
            if (this.ideas.length !== originalIdeasLength) {
                dataChanged = true;
            }
        });

        if (dataChanged) {
            this.syncCleanedDataToFirebase();
        }
    }

    async syncCleanedDataToFirebase() {
        if (!this.isOnline || !this.database) return;
        
        try {
            console.log('🔄 Syncing cleaned data to Firebase...');
            
            const updates = {};
            updates[`teams/${this.teamId}/tasks`] = this.tasks;
            updates[`teams/${this.teamId}/assignedTasks`] = this.assignedTasks;
            updates[`teams/${this.teamId}/attendance`] = this.attendance;
            
            const ideasObj = {};
            this.ideas.forEach(idea => {
                ideasObj[idea.id] = idea;
            });
            updates[`teams/${this.teamId}/ideas`] = ideasObj;
            
            await this.database.ref().update(updates);
            console.log('✅ Cleaned data synced to Firebase');
        } catch (error) {
            console.error('❌ Error syncing cleaned data:', error);
        }
    }

    // Enhanced populate selects for ALL tabs
    populateAllSelects() {
        if (this.pauseUIUpdates) return; // Skip if updates are paused
        
        console.log('🔄 Populating ALL select dropdowns...');
        
        const selects = [
            'attendanceMember',
            'ideaMember', 
            'assignTaskMember',
            'taskMemberSelect',
            'individualMemberSelect'
        ];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                let placeholder = 'Select a member...';
                
                if (selectId === 'taskMemberSelect') placeholder = 'Choose a member to view/manage tasks...';
                if (selectId === 'individualMemberSelect') placeholder = 'Choose member for individual report...';
                
                select.innerHTML = `<option value="">${placeholder}</option>`;
                
                this.members.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member;
                    option.textContent = member;
                    select.appendChild(option);
                });
                
                if (currentValue && this.members.includes(currentValue)) {
                    select.value = currentValue;
                } else {
                    select.value = '';
                }
            }
        });
        
        console.log('✅ All select dropdowns updated');
    }

    populateSelects() {
        this.populateAllSelects();
    }

    updateMemberDependentDisplays() {
        if (this.pauseUIUpdates) return;
        
        this.updatePerformanceSummary();
        this.updateOverviewStats();
        
        const currentTab = document.querySelector('.nav-tab.active')?.dataset.tab;
        if (currentTab === 'tasks' && this.currentSelectedMember) {
            this.displayMemberTasks(this.currentSelectedMember);
        }
        
        console.log('✅ Member-dependent displays updated');
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Tab Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Task Management
        const loadTasksBtn = document.getElementById('loadTasksBtn');
        if (loadTasksBtn) {
            loadTasksBtn.addEventListener('click', () => this.loadMemberTasks());
        }

        const addNewTaskBtn = document.getElementById('addNewTaskBtn');
        if (addNewTaskBtn) {
            addNewTaskBtn.addEventListener('click', () => this.addNewTask());
        }

        // Main Functionality
        const markAttendanceBtn = document.getElementById('markAttendanceBtn');
        if (markAttendanceBtn) {
            markAttendanceBtn.addEventListener('click', () => this.markAttendance());
        }

        const addIdeaBtn = document.getElementById('addIdeaBtn');
        if (addIdeaBtn) {
            addIdeaBtn.addEventListener('click', () => this.addIdea());
        }

        // Admin
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => this.adminLogin());
        }

        const assignTaskBtn = document.getElementById('assignTaskBtn');
        if (assignTaskBtn) {
            assignTaskBtn.addEventListener('click', () => this.assignTask());
        }

        // Dynamic Events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportDataBtn') this.exportData();
            if (e.target.id === 'clearDataBtn') this.clearAllData();
            if (e.target.id === 'logoutAdminBtn') this.logoutAdmin();
            if (e.target.id === 'addMemberBtn') this.addMember();
            if (e.target.classList.contains('delete-btn')) this.deleteIdea(e.target.dataset.id);
            if (e.target.classList.contains('remove-member-btn')) this.removeMember(e.target.dataset.member);
            if (e.target.classList.contains('update-status-btn')) this.updateTaskStatus(e.target.dataset.taskId, e.target.dataset.member);
        });

        // Radio buttons
        document.querySelectorAll('.radio-option').forEach(option => {
            option.addEventListener('click', () => {
                const radio = option.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    this.updateRadioStyles();
                }
            });
        });

        console.log('✅ Event listeners ready');
    }

    // [Include all other existing methods...]
    // Task Management, Attendance, Ideas, Analytics, etc.
    // All methods from previous version remain the same

    loadMemberTasks() {
        const selectedMember = document.getElementById('taskMemberSelect').value;
        if (!selectedMember) {
            this.showMessage('Please select a member!', 'error');
            return;
        }

        if (!this.members.includes(selectedMember)) {
            this.showMessage('Selected member no longer exists!', 'error');
            document.getElementById('taskMemberSelect').value = '';
            return;
        }

        this.currentSelectedMember = selectedMember;
        this.displayMemberTasks(selectedMember);
        this.showMessage(`✅ Loaded tasks for ${selectedMember}`, 'success');
    }

    displayMemberTasks(memberName) {
        if (!this.members.includes(memberName)) {
            const dashboard = document.getElementById('taskDashboard');
            if (dashboard) dashboard.style.display = 'none';
            this.currentSelectedMember = null;
            return;
        }

        const dashboard = document.getElementById('taskDashboard');
        const memberNameDisplay = document.getElementById('selectedMemberName');
        
        dashboard.style.display = 'block';
        memberNameDisplay.textContent = memberName;
        
        const memberTasks = this.tasks[memberName] || [];
        const assignedTasks = this.assignedTasks[memberName] || [];
        
        const completedAssigned = assignedTasks.filter(task => task.status === 'completed').length;
        const pendingAssigned = assignedTasks.filter(task => task.status !== 'completed').length;
        
        document.getElementById('memberTaskCount').textContent = memberTasks.length + assignedTasks.length;
        document.getElementById('memberCompletedTasks').textContent = memberTasks.length + completedAssigned;
        document.getElementById('memberPendingTasks').textContent = pendingAssigned;
        
        this.displayRegularTasks(memberTasks);
        this.displayAssignedTasks(assignedTasks, memberName);
    }

    displayRegularTasks(tasks) {
        const container = document.getElementById('regularTasksList');
        
        if (tasks.length === 0) {
            container.innerHTML = '<p class="no-tasks">No regular tasks yet.</p>';
            return;
        }

        const html = tasks.map(task => `
            <div class="task-card completed">
                <div class="task-content">
                    <div class="task-date">${task.date}</div>
                    <div class="task-description">${task.description}</div>
                </div>
                <div class="task-status">
                    <span class="status-badge completed">✅ Completed</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    displayAssignedTasks(tasks, memberName) {
        const container = document.getElementById('assignedTasksList');
        
        if (tasks.length === 0) {
            container.innerHTML = '<p class="no-tasks">No assigned tasks yet.</p>';
            return;
        }

        const html = tasks.map(task => {
            const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
            const statusIcons = {
                'pending': '⏳',
                'in-progress': '🔄',
                'completed': '✅',
                'blocked': '🚫'
            };
            
            const statusColors = {
                'pending': '#f59e0b',
                'in-progress': '#3b82f6',
                'completed': '#10b981',
                'blocked': '#ef4444'
            };

            return `
                <div class="task-card assigned ${task.status} ${isOverdue ? 'overdue' : ''}">
                    <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <div class="task-priority priority-${task.priority || 'normal'}">${task.priority || 'normal'}</div>
                    </div>
                    
                    <div class="task-content">
                        <div class="task-description">${task.description}</div>
                        <div class="task-meta">
                            <span><i class="fas fa-calendar"></i> Due: ${new Date(task.deadline).toLocaleDateString()}</span>
                            ${isOverdue ? '<span class="overdue-text"><i class="fas fa-exclamation-triangle"></i> OVERDUE</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="task-status">
                        <div class="status-display" style="background: ${statusColors[task.status]};">
                            ${statusIcons[task.status]} ${task.status.replace('-', ' ').toUpperCase()}
                        </div>
                        <button class="btn btn-sm btn-primary update-status-btn" 
                                data-task-id="${task.id}" data-member="${memberName}">
                            <i class="fas fa-edit"></i> Update
                        </button>
                    </div>
                    
                    ${task.remarks ? `
                        <div class="task-remarks">
                            <strong>Remarks:</strong> ${task.remarks}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    async addNewTask() {
        if (!this.currentSelectedMember) {
            this.showMessage('Please select a member first!', 'error');
            return;
        }

        if (!this.members.includes(this.currentSelectedMember)) {
            this.showMessage('Selected member no longer exists!', 'error');
            this.currentSelectedMember = null;
            const dashboard = document.getElementById('taskDashboard');
            if (dashboard) dashboard.style.display = 'none';
            return;
        }

        const description = document.getElementById('newTaskDescription').value.trim();
        if (!description) {
            this.showMessage('Please enter task description!', 'error');
            return;
        }

        const task = {
            id: Date.now().toString(),
            member: this.currentSelectedMember,
            description: description,
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString()
        };

        if (!this.tasks[this.currentSelectedMember]) {
            this.tasks[this.currentSelectedMember] = [];
        }

        this.tasks[this.currentSelectedMember].unshift(task);
        await this.saveData('tasks', this.tasks);
        
        document.getElementById('newTaskDescription').value = '';
        this.displayMemberTasks(this.currentSelectedMember);
        this.showMessage('✅ Task added successfully!', 'success');
    }

    async updateTaskStatus(taskId, member) {
        if (!this.members.includes(member)) {
            this.showMessage('Member no longer exists!', 'error');
            return;
        }

        const memberTasks = this.assignedTasks[member] || [];
        const taskIndex = memberTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const task = memberTasks[taskIndex];
            const newStatus = prompt(
                `Update "${task.title}" status:\n\n` +
                `Current: ${task.status.replace('-', ' ').toUpperCase()}\n\n` +
                `Enter new status:\n` +
                `1 = Pending\n` +
                `2 = In Progress\n` +
                `3 = Completed\n` +
                `4 = Blocked\n\n` +
                `Enter number (1-4):`
            );
            
            if (newStatus) {
                const statusMap = {
                    '1': 'pending',
                    '2': 'in-progress',
                    '3': 'completed',
                    '4': 'blocked'
                };
                
                const status = statusMap[newStatus];
                if (status) {
                    const remarks = prompt(`Add remarks (optional):`);
                    
                    memberTasks[taskIndex].status = status;
                    memberTasks[taskIndex].remarks = remarks || task.remarks;
                    memberTasks[taskIndex].lastUpdated = new Date().toISOString();
                    
                    await this.saveData('assignedTasks', this.assignedTasks);
                    this.displayMemberTasks(member);
                    this.showMessage(`✅ Status updated to: ${status.replace('-', ' ')}`, 'success');
                }
            }
        }
    }

    // Main functionality methods
    async markAttendance() {
        const date = document.getElementById('sessionDate').value;
        const member = document.getElementById('attendanceMember').value;
        const status = document.querySelector('input[name="attendanceStatus"]:checked')?.value;

        if (!date || !member || !status) {
            this.showMessage('Please fill all fields!', 'error');
            return;
        }

        if (!this.members.includes(member)) {
            this.showMessage('Selected member no longer exists!', 'error');
            this.populateAllSelects();
            return;
        }

        if (!this.attendance[date]) {
            this.attendance[date] = {};
        }
        this.attendance[date][member] = status;

        await this.saveData('attendance', this.attendance);
        this.showMessage(`✅ Attendance marked: ${member} - ${status}`, 'success');

        document.getElementById('attendanceMember').value = '';
        document.querySelectorAll('input[name="attendanceStatus"]').forEach(radio => {
            radio.checked = false;
        });
        this.updateRadioStyles();
        this.updateAttendanceDisplay();
    }

    async addIdea() {
        const member = document.getElementById('ideaMember').value;
        const content = document.getElementById('ideaContent').value.trim();

        if (!member || !content) {
            this.showMessage('Please select your name and add idea content!', 'error');
            return;
        }

        if (!this.members.includes(member)) {
            this.showMessage('Selected member no longer exists!', 'error');
            this.populateAllSelects();
            return;
        }

        const idea = {
            id: Date.now().toString(),
            member: member,
            content: content,
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString()
        };

        this.ideas.unshift(idea);
        
        const ideasObj = {};
        this.ideas.forEach(idea => {
            ideasObj[idea.id] = idea;
        });

        await this.saveData('ideas', ideasObj);
        this.showMessage('✅ Idea shared successfully!', 'success');

        document.getElementById('ideaMember').value = '';
        document.getElementById('ideaContent').value = '';
        this.updateIdeasDisplay();
    }

    async assignTask() {
        const member = document.getElementById('assignTaskMember').value;
        const title = document.getElementById('assignTaskTitle').value.trim();
        const description = document.getElementById('assignTaskDescription').value.trim();
        const deadline = document.getElementById('taskDeadline').value;
        const priority = document.getElementById('taskPriority').value;

        if (!member || !title || !description || !deadline) {
            this.showMessage('Please fill all required fields!', 'error');
            return;
        }

        if (!this.members.includes(member)) {
            this.showMessage('Selected member no longer exists!', 'error');
            this.populateAllSelects();
            return;
        }

        const task = {
            id: Date.now().toString(),
            member: member,
            title: title,
            description: description,
            priority: priority,
            deadline: deadline,
            status: 'pending',
            remarks: '',
            assignedDate: new Date().toISOString(),
            assignedBy: 'Admin'
        };

        if (!this.assignedTasks[member]) {
            this.assignedTasks[member] = [];
        }

        this.assignedTasks[member].unshift(task);
        await this.saveData('assignedTasks', this.assignedTasks);
        
        document.getElementById('assignTaskTitle').value = '';
        document.getElementById('assignTaskDescription').value = '';
        document.getElementById('taskDeadline').value = '';
        
        this.showMessage(`✅ Task "${title}" assigned to ${member}!`, 'success');
    }

    // Data Management
    loadLocalData() {
        this.members = JSON.parse(localStorage.getItem('members')) || this.members;
        this.attendance = JSON.parse(localStorage.getItem('attendance')) || {};
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        this.ideas = JSON.parse(localStorage.getItem('ideas')) || [];
        this.assignedTasks = JSON.parse(localStorage.getItem('assignedTasks')) || {};
    }

    saveToLocalStorage() {
        localStorage.setItem('members', JSON.stringify(this.members));
        localStorage.setItem('attendance', JSON.stringify(this.attendance));
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('ideas', JSON.stringify(this.ideas));
        localStorage.setItem('assignedTasks', JSON.stringify(this.assignedTasks));
    }

    async syncToFirebase() {
        if (!this.isOnline || !this.database) return;
        
        try {
            const updates = {};
            updates[`teams/${this.teamId}/members`] = this.members;
            updates[`teams/${this.teamId}/attendance`] = this.attendance;
            updates[`teams/${this.teamId}/tasks`] = this.tasks;
            updates[`teams/${this.teamId}/assignedTasks`] = this.assignedTasks;
            
            const ideasObj = {};
            this.ideas.forEach(idea => {
                ideasObj[idea.id] = idea;
            });
            updates[`teams/${this.teamId}/ideas`] = ideasObj;
            
            await this.database.ref().update(updates);
            console.log('✅ All data synced to Firebase');
        } catch (error) {
            console.error('❌ Firebase sync error:', error);
        }
    }

    // UI Helper Methods
    switchTab(tabName) {
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

        if (tabName === 'admin' && this.isAdminLoggedIn) {
            this.updateMembersList();
        }

        if (tabName !== 'tasks') {
            const dashboard = document.getElementById('taskDashboard');
            if (dashboard) dashboard.style.display = 'none';
        }

        this.updateAllDisplays();
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T');
        const sessionDate = document.getElementById('sessionDate');
        if (sessionDate) sessionDate.value = today;
    }

    updateAllDisplays() {
        if (this.pauseUIUpdates) return;
        
        console.log('🔄 Updating all displays...');
        
        this.updateAttendanceDisplay();
        this.updateTasksDisplay();  
        this.updateIdeasDisplay();
        this.updateOverviewStats();
        this.updateMemberDependentDisplays();
        
        console.log('✅ All displays updated');
    }

    // Fixed Analytics (from previous version)
    updateOverviewStats() {
        console.log('📊 Calculating overview statistics...');
        
        const stats = this.calculateCorrectStats();
        
        document.getElementById('totalTasks').textContent = stats.totalAllTasks;
        document.getElementById('totalIdeas').textContent = stats.totalIdeas;
        document.getElementById('avgAttendance').textContent = stats.avgAttendanceRate + '%';
        document.getElementById('activeDays').textContent = stats.activeDays;
        
        this.updatePerformanceSummary();
        
        console.log('✅ Overview statistics updated:', stats);
    }

    calculateCorrectStats() {
        const totalMembers = this.members.length;
        
        let totalRegularTasks = 0;
        let totalAssignedTasks = 0;
        
        this.members.forEach(member => {
            if (this.tasks[member] && Array.isArray(this.tasks[member])) {
                totalRegularTasks += this.tasks[member].length;
            }
            
            if (this.assignedTasks[member] && Array.isArray(this.assignedTasks[member])) {
                totalAssignedTasks += this.assignedTasks[member].length;
            }
        });
        
        const totalAllTasks = totalRegularTasks + totalAssignedTasks;
        const totalIdeas = Array.isArray(this.ideas) ? this.ideas.length : 0;
        const attendanceStats = this.calculateCorrectAttendanceStats();
        
        const activeDays = Object.keys(this.attendance).filter(date => {
            const dayData = this.attendance[date];
            return dayData && Object.keys(dayData).length > 0;
        }).length;
        
        return {
            totalMembers,
            totalRegularTasks,
            totalAssignedTasks,
            totalAllTasks,
            totalIdeas,
            activeDays,
            avgAttendanceRate: attendanceStats.avgAttendanceRate
        };
    }

    calculateCorrectAttendanceStats() {
        let totalPresentRecords = 0;
        let totalAttendanceRecords = 0;
        let validDaysCount = 0;
        let dailyRates = [];
        
        const attendanceDates = Object.keys(this.attendance);
        
        attendanceDates.forEach(date => {
            const dayAttendance = this.attendance[date];
            if (!dayAttendance || typeof dayAttendance !== 'object') return;
            
            let dayPresentCount = 0;
            let dayTotalCount = 0;
            
            this.members.forEach(member => {
                if (dayAttendance[member]) {
                    dayTotalCount++;
                    totalAttendanceRecords++;
                    
                    if (dayAttendance[member] === 'present') {
                        dayPresentCount++;
                        totalPresentRecords++;
                    }
                }
            });
            
            if (dayTotalCount > 0) {
                const dayRate = (dayPresentCount / dayTotalCount) * 100;
                dailyRates.push(dayRate);
                validDaysCount++;
            }
        });
        
        let avgAttendanceRate = 0;
        if (validDaysCount > 0) {
            avgAttendanceRate = Math.round(
                dailyRates.reduce((sum, rate) => sum + rate, 0) / validDaysCount
            );
        }
        
        return {
            totalRecords: totalAttendanceRecords,
            totalPresent: totalPresentRecords,
            validDays: validDaysCount,
            avgAttendanceRate: avgAttendanceRate
        };
    }

    updatePerformanceSummary() {
        const performanceSummary = document.getElementById('performanceSummary');
        if (!performanceSummary || this.pauseUIUpdates) return;

        const memberStats = this.members.map(member => {
            const regularTaskCount = this.tasks[member] ? this.tasks[member].length : 0;
            const ideaCount = Array.isArray(this.ideas) ? 
                this.ideas.filter(idea => idea.member === member).length : 0;
            
            const assignedTasks = this.assignedTasks[member] || [];
            const completedAssignedTasks = assignedTasks.filter(task => task.status === 'completed').length;
            const attendanceStats = this.calculateMemberAttendanceStats(member);
            
            const performanceScore = regularTaskCount + ideaCount + (completedAssignedTasks * 2) + (attendanceStats.attendanceRate * 0.1);
            
            return {
                name: member,
                regularTasks: regularTaskCount,
                ideas: ideaCount,
                completedAssignedTasks: completedAssignedTasks,
                attendanceRate: attendanceStats.attendanceRate,
                performanceScore: Math.round(performanceScore * 10) / 10
            };
        });

        memberStats.sort((a, b) => b.performanceScore - a.performanceScore);

        const html = `
            <h3 style="margin-bottom: 24px;"><i class="fas fa-trophy"></i> Team Performance Rankings</h3>
            <div class="members-grid">
                ${memberStats.slice(0, 6).map((member, index) => `
                    <div class="member-card">
                        <div class="member-header">
                            <div class="member-name">
                                ${index < 3 ? `<i class="fas fa-medal" style="color: ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'}; margin-right: 8px;"></i>` : ''}
                                ${member.name}
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 16px;">
                            <div style="text-align: center; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${member.regularTasks}</div>
                                <div style="font-size: 12px; color: var(--gray-600);">Tasks</div>
                            </div>
                            <div style="text-align: center; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${member.ideas}</div>
                                <div style="font-size: 12px; color: var(--gray-600);">Ideas</div>
                            </div>
                            <div style="text-align: center; padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning);">${member.attendanceRate}%</div>
                                <div style="font-size: 12px; color: var(--gray-600);">Attendance</div>
                            </div>
                            <div style="text-align: center; padding: 12px; background: rgba(139, 69, 19, 0.1); border-radius: 8px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: #8b4513;">${member.completedAssignedTasks}</div>
                                <div style="font-size: 12px; color: var(--gray-600);">Assigned</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        performanceSummary.innerHTML = html;
    }

    calculateMemberAttendanceStats(memberName) {
        let presentDays = 0;
        let totalDays = 0;
        
        Object.keys(this.attendance).forEach(date => {
            const dayAttendance = this.attendance[date];
            if (dayAttendance && dayAttendance[memberName]) {
                totalDays++;
                if (dayAttendance[memberName] === 'present') {
                    presentDays++;
                }
            }
        });
        
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        return {
            presentDays,
            totalDays,
            attendanceRate
        };
    }

    updateAttendanceDisplay() {
        const membersList = document.getElementById('membersList');
        if (!membersList || this.pauseUIUpdates) return;

        const today = new Date().toISOString().split('T');
        const todayAttendance = this.attendance[today] || {};

        let presentCount = 0, absentCount = 0, notMarkedCount = 0;

        this.members.forEach(member => {
            const status = todayAttendance[member];
            if (status === 'present') {
                presentCount++;
            } else if (status === 'absent') {
                absentCount++;
            } else {
                notMarkedCount++;
            }
        });

        let html = '<div class="attendance-date-group">';
        html += '<div class="date-header"><span><i class="fas fa-calendar-day"></i> Today\'s Attendance</span></div>';
        html += '<div class="members-grid" style="padding: 24px;">';

        this.members.forEach(member => {
            const status = todayAttendance[member] || 'not-marked';
            html += `
                <div class="member-card ${status}">
                    <div class="member-header">
                        <div class="member-name">${member}</div>
                        <div class="status-badge status-${status}">
                            <i class="fas fa-${status === 'present' ? 'check' : status === 'absent' ? 'times' : 'clock'}"></i>
                            ${status === 'not-marked' ? 'Not Marked' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        membersList.innerHTML = html;

        document.getElementById('presentCount').textContent = presentCount;
        document.getElementById('absentCount').textContent = absentCount;
        document.getElementById('notMarkedCount').textContent = notMarkedCount;
        
        const todayRate = this.members.length > 0 ? Math.round((presentCount / this.members.length) * 100) : 0;
        document.getElementById('attendanceRate').textContent = todayRate + '%';
    }

    updateTasksDisplay() {
        console.log('✅ Tasks display updated');
    }

    updateIdeasDisplay() {
        const ideasBoard = document.getElementById('ideasBoard');
        if (!ideasBoard || this.pauseUIUpdates) return;

        if (this.ideas.length === 0) {
            ideasBoard.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                    <i class="fas fa-lightbulb" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p>No ideas shared yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        const html = this.ideas.map(idea => `
            <div class="idea-card">
                <button class="delete-btn" data-id="${idea.id}">
                    <i class="fas fa-times"></i>
                </button>
                <div class="idea-author">${idea.member} - ${idea.date}</div>
                <div class="idea-content">${idea.content}</div>
            </div>
        `).join('');

        ideasBoard.innerHTML = html;
    }

    updateRadioStyles() {
        document.querySelectorAll('.radio-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    // Admin Functions
    adminLogin() {
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminError');
        
        if (password === this.adminPassword) {
            this.isAdminLoggedIn = true;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            if (errorDiv) errorDiv.style.display = 'none';
            this.updateMembersList();
            this.showMessage('✅ Admin access granted!', 'success');
        } else {
            if (errorDiv) errorDiv.style.display = 'block';
            document.getElementById('adminPassword').value = '';
        }
    }

    logoutAdmin() {
        this.isAdminLoggedIn = false;
        document.getElementById('adminLogin').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminPassword').value = '';
        this.showMessage('✅ Admin logged out successfully!', 'success');
    }

    updateMembersList() {
        const membersList = document.querySelector('#admin .members-list');
        if (!membersList) return;
        
        const html = this.members.map(member => `
            <div class="member-item">
                <span class="member-name">${member}</span>
                <button class="remove-member-btn" data-member="${member}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        membersList.innerHTML = html;
    }

    async deleteIdea(ideaId) {
        if (confirm('Delete this idea?')) {
            this.ideas = this.ideas.filter(idea => idea.id !== ideaId);
            
            const ideasObj = {};
            this.ideas.forEach(idea => {
                ideasObj[idea.id] = idea;
            });
            
            await this.saveData('ideas', ideasObj);
            this.showMessage('✅ Idea deleted successfully!', 'success');
            this.updateIdeasDisplay();
        }
    }

    exportData() {
        const data = {
            members: this.members,
            attendance: this.attendance,
            tasks: this.tasks,
            ideas: this.ideas,
            assignedTasks: this.assignedTasks,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team_data_${new Date().toISOString().split('T')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('✅ Data exported successfully!', 'success');
    }

    async clearAllData() {
        if (confirm('Clear all data? This cannot be undone!')) {
            this.attendance = {};
            this.tasks = {};
            this.ideas = [];
            this.assignedTasks = {};
            
            await this.saveData('attendance', this.attendance);
            await this.saveData('tasks', this.tasks);
            await this.saveData('ideas', []);
            await this.saveData('assignedTasks', this.assignedTasks);
            
            this.updateAllDisplays();
            this.showMessage('✅ All data cleared successfully!', 'success');
        }
    }

    showMessage(message, type = 'success') {
        const messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;
        
        messageContainer.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Initialize Team Manager
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Starting FIXED Team Management App');
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded');
        return;
    }
    
    window.teamManager = new TeamManager();
});
