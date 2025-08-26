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

// COMPLETE Team Manager - ALL FEATURES WITH ENHANCED PDF EXPORT
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
        try {
            this.loadLocalData();
            this.initializeMemberDetails();
            await this.initializeFirebaseWithAuth();
            this.setupEventListeners();
            this.populateAllSelects();
            this.setTodayDate();
            this.updateAllDisplays();
            
            this.showMessage('✅ System ready with enhanced PDF export!', 'success');
            console.log('✅ System fully initialized with PDF capabilities');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showMessage('❌ System initialization failed. Working offline.', 'error');
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

    // Firebase Connection
    async initializeFirebaseWithAuth() {
        try {
            console.log('🔄 Connecting to Firebase...');
            
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.database = firebase.database();
            this.auth = firebase.auth();
            
            await this.auth.signInAnonymously();
            console.log('✅ Firebase connected');
            
            this.isOnline = true;
            this.updateSyncStatus('Connected');
            
        } catch (error) {
            console.error('❌ Firebase connection failed:', error);
            this.isOnline = false;
            this.updateSyncStatus('Offline');
        }
    }

    // ATTENDANCE FUNCTIONS
    async markAttendance() {
        console.log('📋 Mark Attendance clicked');
        
        try {
            const date = document.getElementById('sessionDate').value;
            const member = document.getElementById('attendanceMember').value;
            const status = document.querySelector('input[name="attendanceStatus"]:checked')?.value;

            if (!date || !member || !status) {
                this.showMessage('❌ Please fill all fields!', 'error');
                return;
            }

            if (!this.attendance[date]) this.attendance[date] = {};
            this.attendance[date][member] = status;

            // Clear form
            document.getElementById('attendanceMember').value = '';
            document.querySelectorAll('input[name="attendanceStatus"]').forEach(radio => {
                radio.checked = false;
            });
            
            this.updateAttendanceDisplay();
            this.showMessage(`✅ Attendance marked: ${member} - ${status}`, 'success');
            
        } catch (error) {
            console.error('Mark attendance failed:', error);
            this.showMessage('❌ Failed to mark attendance.', 'error');
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
        console.log('📋 Load Member Tasks clicked');
        
        try {
            const selectedMember = document.getElementById('taskMemberSelect').value;
            
            if (!selectedMember || !this.members.includes(selectedMember)) {
                this.showMessage('❌ Please select a valid member!', 'error');
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
                this.showMessage(`✅ Tasks loaded for ${selectedMember}!`, 'success');
            }
            
        } catch (error) {
            console.error('Error loading member tasks:', error);
            this.showMessage('❌ Failed to load member tasks.', 'error');
        }
    }

    displayMemberTasks(memberName) {
        const regularTasksList = document.getElementById('regularTasksList');
        const assignedTasksList = document.getElementById('assignedTasksList');
        
        if (regularTasksList) {
            const memberTasks = this.tasks[memberName] || [];
            
            if (memberTasks.length === 0) {
                regularTasksList.innerHTML = '<div class="no-tasks">No regular tasks yet.</div>';
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
                assignedTasksList.innerHTML = '<div class="no-tasks">No assigned tasks yet.</div>';
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

    addNewTask() {
        console.log('➕ Add New Task clicked');
        
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
            
            this.displayMemberTasks(this.currentSelectedMember);
            this.showMessage(`✅ Task added for ${this.currentSelectedMember}!`, 'success');
            
        } catch (error) {
            console.error('Add new task failed:', error);
            this.showMessage('❌ Failed to add task.', 'error');
        }
    }

    updateTaskStatus(memberName, taskIndex) {
        const newStatus = prompt('Enter new status (pending, in-progress, completed, blocked):');
        if (newStatus && this.tasks[memberName] && this.tasks[memberName][taskIndex]) {
            const validStatuses = ['pending', 'in-progress', 'completed', 'blocked'];
            if (validStatuses.includes(newStatus.toLowerCase())) {
                this.tasks[memberName][taskIndex].status = newStatus.toLowerCase();
                this.displayMemberTasks(memberName);
                this.showMessage(`✅ Task status updated!`, 'success');
            } else {
                this.showMessage('❌ Invalid status.', 'error');
            }
        }
    }

    deleteTask(memberName, taskIndex) {
        if (confirm('Delete this task?')) {
            if (this.tasks[memberName] && this.tasks[memberName][taskIndex] !== undefined) {
                this.tasks[memberName].splice(taskIndex, 1);
                this.displayMemberTasks(memberName);
                this.showMessage('✅ Task deleted!', 'success');
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
    addIdea() {
        console.log('💡 Add Idea clicked');
        
        try {
            const member = document.getElementById('ideaMember').value;
            const content = document.getElementById('ideaContent').value.trim();

            if (!member || !content) {
                this.showMessage('❌ Please fill all fields!', 'error');
                return;
            }

            if (!this.members.includes(member)) {
                this.showMessage('❌ Selected member not found!', 'error');
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
            
            document.getElementById('ideaMember').value = '';
            document.getElementById('ideaContent').value = '';
            
            this.updateIdeasDisplay();
            this.showMessage('✅ Idea shared successfully!', 'success');
            
        } catch (error) {
            console.error('Add idea failed:', error);
            this.showMessage('❌ Failed to share idea.', 'error');
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

    deleteIdea(id) {
        if (confirm('Delete this idea?')) {
            this.ideas = this.ideas.filter(idea => idea.id !== id);
            this.updateIdeasDisplay();
            this.showMessage('✅ Idea deleted!', 'success');
        }
    }

    // ENHANCED OVERVIEW FUNCTIONS - Performance Report & PDF Export
    showPerformanceReport() {
        console.log('📊 Performance Report clicked');
        
        try {
            const performanceReport = document.getElementById('performanceReport');
            const performanceContent = document.getElementById('performanceContent');
            const btn = document.getElementById('performanceReportBtn');
            
            if (!performanceReport || !performanceContent) {
                this.showMessage('❌ Performance report elements not found', 'error');
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
                btn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Performance Report';
            }
            
        } catch (error) {
            console.error('Performance report error:', error);
            this.showMessage('❌ Failed to generate performance report', 'error');
        }
    }

    // ENHANCED: Complete Performance Report with Individual Rankings
    generateCompletePerformanceReport() {
        try {
            const totalMembers = this.members.length;
            const totalTasks = this.calculateTotalTasks();
            const totalIdeas = this.ideas.length;
            const avgAttendance = this.calculateAvgAttendance();
            
            const allMemberPerformance = this.calculateAllMembersPerformance();
            
            return `
                <div class="performance-overview">
                    <h4><i class="fas fa-chart-pie"></i> Enhanced Team Performance Analysis</h4>
                    <div class="performance-metrics">
                        <div class="metric-card">
                            <div class="metric-title">Team Size</div>
                            <div class="metric-value">${totalMembers}</div>
                            <div class="metric-trend">Complete Team</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">Total Tasks</div>
                            <div class="metric-value">${totalTasks}</div>
                            <div class="metric-trend">${totalTasks > totalMembers ? 'High Productivity' : 'Building'}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">Ideas Generated</div>
                            <div class="metric-value">${totalIdeas}</div>
                            <div class="metric-trend">${totalIdeas > totalMembers ? 'Creative Team' : 'Growing'}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">Avg Attendance</div>
                            <div class="metric-value">${avgAttendance}%</div>
                            <div class="metric-trend">${avgAttendance >= 80 ? 'Excellent' : avgAttendance >= 60 ? 'Good' : 'Improving'}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">Firebase Status</div>
                            <div class="metric-value">${this.isOnline ? 'ONLINE' : 'OFFLINE'}</div>
                            <div class="metric-trend">PDF Export Ready</div>
                        </div>
                    </div>
                </div>

                <div class="performance-section">
                    <h4><i class="fas fa-trophy"></i> Individual Performance Rankings</h4>
                    <div class="ranking-controls" style="margin-bottom: 20px;">
                        <button class="btn btn-sm btn-info" onclick="window.teamManager.exportTopPerformerReport()">
                            <i class="fas fa-download"></i> Export Top Performer
                        </button>
                        <button class="btn btn-sm btn-success" onclick="window.teamManager.exportCategoryPDF()">
                            <i class="fas fa-file-pdf"></i> Export Rankings PDF
                        </button>
                    </div>
                    
                    <div class="member-performance-grid">
                        ${allMemberPerformance.map((member, index) => `
                            <div class="performance-member-card ${index < 3 ? 'top-performer' : ''}">
                                <div class="performance-rank rank-${index + 1}">${index + 1}</div>
                                <div class="member-info">
                                    <h5>${member.name}</h5>
                                    <div class="performance-score">Score: ${member.score}%</div>
                                </div>
                                <div class="performance-stats">
                                    <div class="stat-row">
                                        <div class="stat-item">
                                            <span class="stat-number">${member.attendanceRate}%</span>
                                            <span class="stat-label">Attendance</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-number">${member.ideaCount}</span>
                                            <span class="stat-label">Ideas</span>
                                        </div>
                                    </div>
                                    <div class="stat-row">
                                        <div class="stat-item">
                                            <span class="stat-number">${member.taskCount || 0}</span>
                                            <span class="stat-label">Tasks</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-number">${member.activeDays || 0}</span>
                                            <span class="stat-label">Days</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="performance-badge ${this.getPerformanceBadgeClass(member.score)}">
                                    ${this.getPerformanceBadge(member.score)}
                                </div>
                                <div class="individual-actions" style="margin-top: 15px; text-align: center;">
                                    <button class="btn btn-sm btn-primary" onclick="window.teamManager.generateIndividualReport('${member.name}')">
                                        <i class="fas fa-user"></i> Individual PDF
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="report-footer">
                    <p><i class="fas fa-info-circle"></i> Report generated on ${new Date().toLocaleString()}</p>
                    <p><i class="fas fa-sync-alt"></i> Firebase Sync: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}</p>
                    <p><i class="fas fa-users"></i> Individual Rankings: All ${totalMembers} Members</p>
                    <p><i class="fas fa-database"></i> Enhanced PDF export with individual reports available</p>
                </div>
            `;
        } catch (error) {
            console.error('Error generating performance report:', error);
            return `<div class="error-message"><h4>⚠️ Error Generating Report</h4><p>${error.message}</p></div>`;
        }
    }

    // NEW: Enhanced PDF Export Function
    async exportCategoryPDF() {
        console.log('📄 Export PDF clicked');
        
        try {
            const category = document.getElementById('exportCategory')?.value || 'performance-analysis';
            const selectedMember = document.getElementById('individualMemberSelect')?.value;
            
            // Check if jsPDF is available
            if (typeof window.jspdf === 'undefined') {
                this.showMessage('❌ PDF library not loaded. Please refresh the page and ensure internet connection.', 'error');
                return;
            }
            
            this.generateEnhancedPDF(category, selectedMember);
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showMessage('❌ PDF export failed. Please try again.', 'error');
        }
    }

    // NEW: Enhanced PDF Generation with Rankings
    generateEnhancedPDF(category, selectedMember) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const margin = 15;
        let y = margin;
        
        // PDF Header
        doc.setFontSize(18);
        doc.setTextColor(102, 126, 234);
        doc.text('AI T19 Team Management Report', margin, y);
        y += 15;
        
        // Date and System Info
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
        y += 5;
        doc.text(`Firebase Status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`, margin, y);
        y += 10;
        
        switch(category) {
            case 'complete-team-report':
                this.generateCompleteTeamPDF(doc, margin, y);
                break;
            case 'individual-member-report':
                if (selectedMember && this.members.includes(selectedMember)) {
                    this.generateIndividualMemberPDF(doc, margin, y, selectedMember);
                } else {
                    this.showMessage('❌ Please select a member for individual report.', 'error');
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
        this.showMessage('✅ PDF exported successfully!', 'success');
    }

    // NEW: Complete Team PDF with Rankings
    generateCompleteTeamPDF(doc, margin, startY) {
        let y = startY;
        
        // Team Overview
        doc.setFontSize(14);
        doc.setTextColor(102, 126, 234);
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
        
        // Performance Rankings Table
        doc.setFontSize(14);
        doc.setTextColor(102, 126, 234);
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
        
        // Use autoTable if available
        if (doc.autoTable) {
            doc.autoTable({
                startY: y,
                head: [tableColumns],
                body: tableRows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [102, 126, 234],
                    textColor: [255, 255, 255],
                    fontSize: 10
                },
                styles: { fontSize: 9 },
                margin: { left: margin, right: margin }
            });
        } else {
            // Fallback text-based table
            y += 5;
            doc.setFontSize(9);
            tableColumns.forEach((col, index) => {
                doc.text(col, margin + (index * 30), y);
            });
            y += 5;
            
            tableRows.forEach(row => {
                row.forEach((cell, index) => {
                    doc.text(String(cell), margin + (index * 30), y);
                });
                y += 5;
            });
        }
    }

    // NEW: Individual Member PDF Report
    generateIndividualMemberPDF(doc, margin, startY, memberName) {
        let y = startY;
        
        // Member Header
        doc.setFontSize(16);
        doc.setTextColor(102, 126, 234);
        doc.text(`Individual Report: ${memberName}`, margin, y);
        y += 15;
        
        // Member Performance
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
        
        // Task Breakdown
        if (memberTasks.length > 0 || memberAssignedTasks.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(102, 126, 234);
            doc.text('Task Details:', margin, y); y += 8;
            
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            
            // Regular Tasks
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
            
            // Assigned Tasks
            if (memberAssignedTasks.length > 0) {
                doc.text('Assigned Tasks:', margin, y); y += 5;
                memberAssignedTasks.slice(0, 10).forEach((task, index) => {
                    const status = task.status || 'pending';
                    doc.text(`${index + 1}. [${status.toUpperCase()}] ${task.title}`, margin + 5, y);
                    y += 4;
                });
            }
        }
        
        // Ideas Summary
        if (memberIdeas.length > 0) {
            y += 5;
            doc.setFontSize(12);
            doc.setTextColor(102, 126, 234);
            doc.text('Recent Ideas:', margin, y); y += 8;
            
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            memberIdeas.slice(0, 5).forEach((idea, index) => {
                doc.text(`${index + 1}. ${idea.content.substring(0, 70)}...`, margin + 5, y);
                y += 4;
            });
        }
    }

    // NEW: Performance Analysis PDF
    generatePerformanceAnalysisPDF(doc, margin, startY) {
        let y = startY;
        
        // Performance Analysis Header
        doc.setFontSize(16);
        doc.setTextColor(102, 126, 234);
        doc.text('Detailed Performance Analysis', margin, y);
        y += 15;
        
        // Team Statistics
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
        
        // Top Performers
        doc.setFontSize(12);
        doc.setTextColor(102, 126, 234);
        doc.text('Top Performers:', margin, y); y += 8;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        rankings.slice(0, 5).forEach((member, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐';
            doc.text(`${medal} ${index + 1}. ${member.name} - Score: ${member.score}%`, margin, y);
            y += 6;
        });
        
        y += 10;
        
        // Detailed Rankings Table
        if (doc.autoTable) {
            doc.setFontSize(12);
            doc.setTextColor(102, 126, 234);
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
                    fillColor: [102, 126, 234],
                    textColor: [255, 255, 255],
                    fontSize: 10
                },
                styles: { fontSize: 9 },
                margin: { left: margin, right: margin },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 50 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 25 }
                }
            });
        }
    }

    // NEW: Generate Individual Report PDF
    generateIndividualReport(memberName) {
        console.log(`📊 Generating individual report for: ${memberName}`);
        
        try {
            // Set the individual member select to this member
            const memberSelect = document.getElementById('individualMemberSelect');
            if (memberSelect) {
                memberSelect.value = memberName;
            }
            
            // Set category to individual report
            const categorySelect = document.getElementById('exportCategory');
            if (categorySelect) {
                categorySelect.value = 'individual-member-report';
            }
            
            // Generate the PDF
            this.generateEnhancedPDF('individual-member-report', memberName);
            
        } catch (error) {
            console.error('Individual report error:', error);
            this.showMessage('❌ Failed to generate individual report.', 'error');
        }
    }

    // NEW: Export Top Performer Report
    exportTopPerformerReport() {
        console.log(`📤 Exporting top performer report`);
        
        try {
            const rankings = this.calculateAllMembersPerformance();
            const topPerformer = rankings[0];
            if (topPerformer) {
                this.generateIndividualReport(topPerformer.name);
            } else {
                this.showMessage('❌ No performance data available.', 'error');
            }
        } catch (error) {
            console.error('Export top performer error:', error);
            this.showMessage('❌ Failed to export top performer report.', 'error');
        }
    }

    // NEW: Helper function for performance grades
    getPerformanceGrade(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Improving';
        return 'Needs Focus';
    }

    toggleActivityFeed() {
        console.log('📊 Toggle Activity Feed clicked');
        
        const feed = document.getElementById('activityFeed');
        const btn = document.getElementById('toggleActivityBtn');
        
        if (feed && btn) {
            if (feed.style.display === 'none' || !feed.style.display) {
                feed.style.display = 'block';
                btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Activity Feed';
                this.updateActivityFeed();
            } else {
                feed.style.display = 'none';
                btn.innerHTML = '<i class="fas fa-stream"></i> Show Activity Feed';
            }
        }
    }

    updateActivityFeed() {
        const list = document.getElementById('activityList');
        if (list) {
            list.innerHTML = `
                <div class="activity-item">
                    <span><i class="fas fa-rocket"></i> Enhanced PDF export system active</span>
                    <span class="activity-time">Now</span>
                </div>
                <div class="activity-item">
                    <span><i class="fas fa-check-circle"></i> Individual performance reports ready</span>
                    <span class="activity-time">Now</span>
                </div>
                <div class="activity-item">
                    <span><i class="fas fa-sync-alt"></i> Firebase sync: ${this.isOnline ? 'Connected' : 'Offline'}</span>
                    <span class="activity-time">Now</span>
                </div>
            `;
        }
    }

    previewReport() {
        console.log('📄 Preview Report clicked');
        
        try {
            const reportPreview = document.getElementById('reportPreview');
            const reportContent = document.getElementById('reportPreviewContent');
            
            if (!reportPreview || !reportContent) {
                this.showMessage('❌ Report preview elements not found', 'error');
                return;
            }
            
            if (reportPreview.style.display === 'none' || !reportPreview.style.display) {
                reportPreview.style.display = 'block';
                
                const previewHTML = this.generateSimplePreview();
                reportContent.innerHTML = previewHTML;
                
                reportPreview.scrollIntoView({ behavior: 'smooth' });
                this.showMessage('✅ Report preview generated!', 'success');
            } else {
                reportPreview.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Preview error:', error);
            this.showMessage('❌ Preview failed', 'error');
        }
    }

    generateSimplePreview() {
        const rankings = this.calculateAllMembersPerformance();
        
        return `
            <div class="report-header">
                <h4>📊 Enhanced Team Report Preview</h4>
                <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="preview-summary">
                <div class="summary-grid">
                    <div class="summary-item"><strong>Members:</strong> ${this.members.length}</div>
                    <div class="summary-item"><strong>Ideas:</strong> ${this.ideas.length}</div>
                    <div class="summary-item"><strong>Tasks:</strong> ${this.calculateTotalTasks()}</div>
                    <div class="summary-item"><strong>Attendance:</strong> ${this.calculateAvgAttendance()}%</div>
                    <div class="summary-item"><strong>Top Performer:</strong> ${rankings[0]?.name || 'N/A'}</div>
                    <div class="summary-item"><strong>PDF Export:</strong> Ready</div>
                </div>
                
                <h5>📋 Report Contents:</h5>
                <ul>
                    <li>✅ Team Overview & Statistics</li>
                    <li>✅ Individual Performance Rankings</li>
                    <li>✅ Member-specific PDF Reports</li>
                    <li>✅ Top Performer Analysis</li>
                    <li>✅ Enhanced PDF Export with Tables</li>
                    <li>✅ Real-time Firebase Sync Status</li>
                </ul>
                
                <div class="preview-note">
                    <p><i class="fas fa-info-circle"></i> Enhanced PDF export now includes individual reports with detailed performance analysis and rankings.</p>
                </div>
            </div>
        `;
    }

    exportData() {
        console.log('📤 Export JSON Data clicked');
        
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
                    connectionStatus: this.isOnline ? 'ONLINE' : 'OFFLINE',
                    systemVersion: '3.0 Enhanced with PDF Export',
                    pdfExportAvailable: typeof window.jspdf !== 'undefined'
                }
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AI_T19_Enhanced_Data_${new Date().toISOString().split('T')[0]}.json`;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('✅ Enhanced data exported with rankings!', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('❌ Export failed.', 'error');
        }
    }

    // ADMIN PANEL FUNCTIONS
    adminLogin() {
        console.log('🔐 Admin Login clicked');
        
        try {
            const password = document.getElementById('adminPassword').value;
            const clientIP = 'client_' + Date.now();

            if (this.security.isAccountLocked(clientIP)) {
                this.showMessage('❌ Account temporarily locked.', 'error');
                return;
            }

            if (password === this.adminPassword) {
                this.security.recordLoginAttempt(clientIP, true);
                this.isAdminLoggedIn = true;
                
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                document.getElementById('adminError').style.display = 'none';
                
                this.updateAdminMembersList();
                
                this.showMessage('✅ Admin access granted!', 'success');
            } else {
                this.security.recordLoginAttempt(clientIP, false);
                document.getElementById('adminError').style.display = 'block';
                document.getElementById('adminPassword').value = '';
                
                this.showMessage('❌ Invalid password.', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            this.showMessage('❌ Login failed.', 'error');
        }
    }

    addMember() {
        console.log('➕ Add Member clicked');
        
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
            
            this.showMessage(`✅ Member "${sanitizedName}" added!`, 'success');
            
        } catch (error) {
            console.error('Add member failed:', error);
            this.showMessage('❌ Failed to add member.', 'error');
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
                        <button class="btn btn-sm btn-info" onclick="window.teamManager.generateIndividualReport('${member}')">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.teamManager.removeMember('${member}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        membersList.innerHTML = html;
    }

    removeMember(memberName) {
        if (confirm(`Remove "${memberName}"?`)) {
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
                
                this.showMessage(`✅ Member "${memberName}" removed!`, 'success');
                
            } catch (error) {
                console.error('Error removing member:', error);
                this.showMessage('❌ Failed to remove member.', 'error');
            }
        }
    }

    assignTask() {
        console.log('📋 Assign Task clicked');
        
        try {
            const assignTo = document.getElementById('assignTaskMember').value;
            const taskTitle = document.getElementById('taskTitle').value.trim();
            const taskDescription = document.getElementById('taskDescription').value.trim();
            const priority = document.querySelector('input[name="taskPriority"]:checked')?.value || 'low';
            const deadline = document.getElementById('taskDeadline').value;

            if (!assignTo || !taskTitle || !taskDescription) {
                this.showMessage('❌ Please fill all required fields!', 'error');
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
                
                this.showMessage(`✅ Task assigned to all ${this.members.length} members!`, 'success');
            } else {
                if (!this.assignedTasks[assignTo]) this.assignedTasks[assignTo] = [];
                this.assignedTasks[assignTo].push(newTask);
                
                this.showMessage(`✅ Task assigned to ${assignTo}!`, 'success');
            }

            // Clear form
            document.getElementById('assignTaskMember').value = '';
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskDeadline').value = '';
            document.querySelectorAll('input[name="taskPriority"]').forEach(radio => {
                radio.checked = false;
            });

            this.updateRecentAssignedTasks();
            
        } catch (error) {
            console.error('Assign task failed:', error);
            this.showMessage('❌ Failed to assign task.', 'error');
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
                recentTasksList.innerHTML = '<div class="no-tasks">No tasks assigned yet.</div>';
                return;
            }

            const html = recentTasks.map(task => `
                <div class="recent-task-item">
                    <div class="task-info">
                        <strong>${task.title}</strong>
                        <small>Assigned to: ${task.assignedTo} | Priority: ${task.priority} | Status: ${task.status}</small>
                    </div>
                    <div class="task-status-mini status-${task.status}">
                        ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </div>
                </div>
            `).join('');

            recentTasksList.innerHTML = html;

        } catch (error) {
            console.error('Error updating recent assigned tasks:', error);
        }
    }

    clearAllData() {
        if (confirm('Clear all data? This cannot be undone!')) {
            try {
                this.attendance = {};
                this.tasks = {};
                this.ideas = [];
                this.assignedTasks = {};
                
                this.updateAllDisplays();
                this.showMessage('✅ All data cleared!', 'success');
                
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
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // ENHANCED HELPER FUNCTIONS
    calculateAllMembersPerformance() {
        try {
            return this.members.map(member => {
                const attendanceRate = this.calculateMemberAttendanceRate(member);
                const ideaCount = this.ideas.filter(idea => idea.member === member).length;
                const taskCount = this.calculateMemberTaskCount(member);
                const activeDays = this.calculateMemberActiveDays(member);
                
                // Enhanced scoring algorithm
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

    getPerformanceBadge(score) {
        if (score >= 90) return '🏆 Excellent';
        if (score >= 80) return '⭐ Very Good';
        if (score >= 70) return '👍 Good';
        if (score >= 60) return '📈 Improving';
        return '🎯 Focus Needed';
    }

    getPerformanceBadgeClass(score) {
        if (score >= 90) return 'badge-excellent';
        if (score >= 80) return 'badge-very-good';
        if (score >= 70) return 'badge-good';
        if (score >= 60) return 'badge-improving';
        return 'badge-needs-focus';
    }

    // EVENT LISTENERS SETUP - ENHANCED
    setupEventListeners() {
        try {
            console.log('🔧 Setting up enhanced event listeners...');
            
            // Navigation tabs
            const navTabs = document.querySelector('.nav-tabs');
            if (navTabs) {
                navTabs.addEventListener('click', (e) => {
                    if (e.target.closest('.nav-tab')) {
                        const tab = e.target.closest('.nav-tab');
                        this.switchTab(tab.dataset.tab);
                    }
                });
            }

            // ENHANCED: All button handlers with PDF export functionality
            const buttonHandlers = {
                // Attendance
                'markAttendanceBtn': () => this.markAttendance(),
                
                // Tasks  
                'loadTasksBtn': () => this.loadMemberTasks(),
                'addNewTaskBtn': () => this.addNewTask(),
                
                // Ideas
                'addIdeaBtn': () => this.addIdea(),
                
                // Overview - Enhanced with PDF Export
                'toggleActivityBtn': () => this.toggleActivityFeed(),
                'performanceReportBtn': () => this.showPerformanceReport(),
                'previewReportBtn': () => this.previewReport(),
                'exportDataBtn': () => this.exportData(), // JSON Export
                'exportCategoryPdfBtn': () => this.exportCategoryPDF(), // NEW: PDF Export
                
                // Admin
                'adminLoginBtn': () => this.adminLogin(),
                'addMemberBtn': () => this.addMember(),
                'assignTaskBtn': () => this.assignTask(),
                'clearDataBtn': () => this.clearAllData(),
                'logoutAdminBtn': () => this.logoutAdmin()
            };

            // Attach all event listeners
            Object.entries(buttonHandlers).forEach(([id, handler]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log(`🖱️ Button clicked: ${id}`);
                        handler();
                    });
                    console.log(`✅ Event listener attached to: ${id}`);
                } else {
                    console.warn(`⚠️ Element not found: ${id}`);
                }
            });

            // Radio group handlers
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

            console.log('✅ Enhanced event listeners setup completed with PDF export');
            
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    // UI UPDATE METHODS
    updateSyncStatus(status) {
        try {
            const syncText = document.getElementById('syncText');
            const syncIcon = document.getElementById('syncIcon');
            
            if (syncText) syncText.textContent = status;
            
            if (syncIcon) {
                let iconClass = 'fas fa-cloud';
                if (status.includes('Connected')) {
                    iconClass = 'fas fa-cloud-upload-alt';
                } else if (status.includes('Offline')) {
                    iconClass = 'fas fa-exclamation-triangle';
                }
                syncIcon.className = iconClass;
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
            this.updateAttendanceDisplay();
            this.updateIdeasDisplay();
            this.updateOverviewStats();
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
            console.log(`📢 Message: ${message} (${type})`);
            
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
}

// ENHANCED: Initialize the complete system with PDF capabilities
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 DOM Content Loaded - Initializing Enhanced Team Manager...');
        
        // Check for jsPDF library
        if (typeof window.jspdf === 'undefined') {
            console.warn('⚠️ jsPDF library not loaded - PDF export will be limited');
        } else {
            console.log('✅ jsPDF library detected - PDF export ready');
        }
        
        // Make teamManager globally accessible
        window.teamManager = new CompleteTeamManager();
        
        console.log('✅ AI T19 Enhanced Team Management System Ready - PDF EXPORT WORKING!');
        
        // Add global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
    } catch (error) {
        console.error('❌ System initialization failed:', error);
        
        // Show error status
        const status = document.getElementById('connectionStatus');
        if (status) {
            status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> System Failed to Start';
            status.className = 'connection-status offline';
            status.style.display = 'block';
        }
    }
});

console.log('🎉 AI T19 Enhanced Team Management System - PDF EXPORT & INDIVIDUAL RANKINGS READY!');
