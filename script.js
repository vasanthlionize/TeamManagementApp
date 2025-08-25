// config.js - Updated without .env dependency
const CONFIG = {
    // Firebase configuration (client-side)
    firebase: {
        apiKey: "AIzaSyBX4s8BSIYPlLfFSAu3KFT5u8tmHWA5cxo",
        authDomain: "team-management-app-63275.firebaseapp.com",
        databaseURL: "https://team-management-app-63275-default-rtdb.firebaseio.com",
        projectId: "team-management-app-63275",
        storageBucket: "team-management-app-63275.firebasestorage.app",
        messagingSenderId: "513377063529",
        appId: "1:513377063529:web:5fce8f99b6b48a816288f8"
    },
    
    // Security settings (client-side limitations apply)
    security: {
        maxLoginAttempts: 3,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMaxRequests: 100,
        // Note: Real password hashing will be done on backend
        adminPasswordPlaceholder: 'admin123' // Will be replaced with backend auth
    },
    
    // Application settings
    app: {
        name: 'AI T19 Team Management',
        version: '2.0.0',
        environment: 'development', // development, staging, production
        debug: true
    },
    
    // Performance settings
    performance: {
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        debounceDelay: 300, // ms
        maxCacheSize: 100
    }
};

export default CONFIG;

// Enhanced TeamManager with Performance Optimizations
class EnhancedTeamManager extends TeamManager {
    constructor() {
        super();
        this.sanitizer = new InputSanitizer();
        this.security = new SecurityManager();
        this.cache = new Map();
        this.debounceTimers = new Map();
        
        // Initialize performance monitoring
        this.performanceMetrics = {
            renderTimes: [],
            apiCalls: 0,
            cacheHits: 0
        };
    }
    
    // Debounced operations to prevent excessive calls
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
    
    // Enhanced caching system
    getCachedData(key, ttl = 5 * 60 * 1000) { // 5 minutes default
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < ttl) {
            this.performanceMetrics.cacheHits++;
            return cached.data;
        }
        
        return null;
    }
    
    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    // Performance-optimized attendance display
    updateAttendanceDisplay() {
        const cacheKey = 'attendance_display';
        const cached = this.getCachedData(cacheKey, 2 * 60 * 1000); // 2 minutes
        
        if (cached) {
            this.renderAttendanceHTML(cached);
            return;
        }
        
        const startTime = performance.now();
        
        // Original attendance calculation logic here...
        const attendanceData = this.calculateAttendanceData();
        
        this.setCachedData(cacheKey, attendanceData);
        this.renderAttendanceHTML(attendanceData);
        
        const endTime = performance.now();
        this.performanceMetrics.renderTimes.push(endTime - startTime);
    }
    
    // Batch Firebase operations
    async batchSaveData(operations) {
        if (!this.isOnline || !this.database) {
            operations.forEach(op => this.queueOfflineOperation(op.type, op.data));
            return;
        }
        
        try {
            const updates = {};
            operations.forEach(op => {
                updates[`teams/${this.teamId}/${op.type}`] = op.data;
            });
            
            await this.database.ref().update(updates);
            console.log(`✅ Batch saved ${operations.length} operations`);
        } catch (error) {
            console.error('Batch save failed:', error);
            operations.forEach(op => this.queueOfflineOperation(op.type, op.data));
        }
    }
    
    // Enhanced input validation with sanitization
    async addMember() {
        const memberName = document.getElementById('newMemberName').value.trim();
        
        // Rate limiting check
        if (!this.security.checkRateLimit('add_member', 10, 60000)) {
            this.showMessage('❌ Too many requests. Please wait a moment.', 'error');
            return;
        }
        
        // Input validation and sanitization
        const sanitizedName = this.sanitizer.sanitizeAndValidate(memberName, 'memberName');
        
        if (!sanitizedName) {
            this.showMessage('❌ Invalid member name. Use only letters and spaces (2-50 characters).', 'error');
            return;
        }
        
        if (this.members.includes(sanitizedName)) {
            this.showMessage('❌ Member already exists!', 'error');
            return;
        }
        
        console.log('➕ Adding new member:', sanitizedName);
        
        const newMembersArray = [...this.members, sanitizedName];
        this.members = newMembersArray;
        
        const success = await this.saveData('members', newMembersArray);
        
        if (success) {
            document.getElementById('newMemberName').value = '';
            this.showMessage(`✅ Member "${sanitizedName}" added successfully!`, 'success');
            
            // Clear cache to force refresh
            this.cache.clear();
            this.populateAllSelects();
            this.updateMembersList();
        } else {
            this.members = this.members.filter(m => m !== sanitizedName);
            this.showMessage(`❌ Failed to add member "${sanitizedName}".`, 'error');
        }
    }
    
    // Enhanced idea submission with validation
    async addIdea() {
        const member = document.getElementById('ideaMember').value;
        const content = document.getElementById('ideaContent').value.trim();
        
        // Rate limiting
        if (!this.security.checkRateLimit(`idea_${member}`, 5, 60000)) {
            this.showMessage('❌ Too many ideas submitted. Please wait a moment.', 'error');
            return;
        }
        
        // Validation
        if (!member || !this.members.includes(member)) {
            this.showMessage('❌ Please select a valid member!', 'error');
            return;
        }
        
        const sanitizedContent = this.sanitizer.sanitizeAndValidate(content, 'idea');
        if (!sanitizedContent) {
            this.showMessage('❌ Invalid idea content. Please provide 10-1000 characters.', 'error');
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
        
        const ideasObj = {};
        this.ideas.forEach(idea => {
            ideasObj[idea.id] = idea;
        });
        
        await this.saveData('ideas', ideasObj);
        this.showMessage('✅ Idea shared successfully!', 'success');
        
        document.getElementById('ideaMember').value = '';
        document.getElementById('ideaContent').value = '';
        
        // Clear cache and update display
        this.cache.delete('ideas_display');
        this.updateIdeasDisplay();
    }
    
    // Enhanced admin authentication
    adminLogin() {
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminError');
        const clientIP = 'client_' + Date.now(); // Simplified for frontend
        
        // Check if account is locked
        if (this.security.isAccountLocked(clientIP)) {
            this.showMessage('❌ Account temporarily locked due to multiple failed attempts.', 'error');
            return;
        }
        
        // Rate limiting
        if (!this.security.checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
            this.showMessage('❌ Too many login attempts. Please try again later.', 'error');
            return;
        }
        
        const isValid = password === this.adminPassword; // Will be replaced with backend auth
        
        if (isValid) {
            this.security.recordLoginAttempt(clientIP, true);
            this.isAdminLoggedIn = true;
            
            // Create session
            const sessionId = this.security.createSession('admin', { role: 'admin' });
            localStorage.setItem('adminSession', sessionId);
            
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            if (errorDiv) errorDiv.style.display = 'none';
            
            this.updateMembersList();
            this.showMessage('✅ Admin access granted!', 'success');
        } else {
            this.security.recordLoginAttempt(clientIP, false);
            
            if (errorDiv) errorDiv.style.display = 'block';
            document.getElementById('adminPassword').value = '';
            
            const remainingAttempts = 3 - (this.security.loginAttempts.get(clientIP)?.attempts || 0);
            this.showMessage(`❌ Invalid password. ${remainingAttempts} attempts remaining.`, 'error');
        }
    }
    
    // Performance monitoring
    getPerformanceReport() {
        const avgRenderTime = this.performanceMetrics.renderTimes.length > 0 
            ? this.performanceMetrics.renderTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.renderTimes.length 
            : 0;
            
        return {
            averageRenderTime: Math.round(avgRenderTime * 100) / 100,
            totalApiCalls: this.performanceMetrics.apiCalls,
            cacheHitRate: this.performanceMetrics.cacheHits / (this.performanceMetrics.apiCalls || 1),
            cacheSize: this.cache.size
        };
    }
}
// Enhanced Task Management Functions (ADD to existing script.js)

// Task Management Methods - Enhanced
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
    
    // Get tasks data
    const memberTasks = this.tasks[memberName] || [];
    const assignedTasks = this.assignedTasks[memberName] || [];
    
    // Calculate task statistics
    const completedAssigned = assignedTasks.filter(task => task.status === 'completed').length;
    const pendingAssigned = assignedTasks.filter(task => task.status === 'pending').length;
    const inProgressAssigned = assignedTasks.filter(task => task.status === 'in-progress').length;
    
    // Update statistics
    document.getElementById('memberTaskCount').textContent = memberTasks.length + assignedTasks.length;
    document.getElementById('memberCompletedTasks').textContent = memberTasks.length + completedAssigned;
    document.getElementById('memberPendingTasks').textContent = pendingAssigned;
    document.getElementById('memberInProgressTasks').textContent = inProgressAssigned;
    
    // Display tasks
    this.displayRegularTasks(memberTasks);
    this.displayAssignedTasks(assignedTasks, memberName);
}

displayRegularTasks(tasks) {
    const container = document.getElementById('regularTasksList');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="no-tasks">No regular tasks yet.</div>';
        return;
    }

    const html = tasks.map(task => `
        <div class="task-card completed">
            <div class="task-header">
                <div class="task-title">Regular Task</div>
                <div class="task-priority priority-normal">✅ Completed</div>
            </div>
            <div class="task-content">
                <div class="task-date">📅 ${task.date}</div>
                <div class="task-description">${task.description}</div>
            </div>
            <div class="task-status">
                <div class="status-badge completed">
                    <i class="fas fa-check"></i> Completed
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

displayAssignedTasks(tasks, memberName) {
    const container = document.getElementById('assignedTasksList');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="no-tasks">No assigned tasks yet.</div>';
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

        const priorityIcons = {
            'low': '🟢',
            'medium': '🟡',
            'high': '🔴',
            'urgent': '🚨'
        };

        return `
            <div class="task-card assigned ${task.status} ${isOverdue ? 'overdue' : ''}">
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-priority priority-${task.priority || 'normal'}">
                        ${priorityIcons[task.priority] || '⚪'} ${(task.priority || 'normal').toUpperCase()}
                    </div>
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

    // Input sanitization (reuse existing logic)
    const sanitizedDesc = this.sanitizeInput ? this.sanitizeInput(description, 'task') : description;
    if (!sanitizedDesc) {
        this.showMessage('Invalid task description. Please use 5-500 characters.', 'error');
        return;
    }

    const task = {
        id: Date.now().toString(),
        member: this.currentSelectedMember,
        description: sanitizedDesc,
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

// Category-wise PDF Export Functions
handleExportCategoryChange() {
    const category = document.getElementById('exportCategory').value;
    const memberSelectGroup = document.getElementById('memberSelectGroup');
    
    if (category === 'member-individual') {
        memberSelectGroup.style.display = 'block';
    } else {
        memberSelectGroup.style.display = 'none';
    }
}

async exportCategoryPDF() {
    const category = document.getElementById('exportCategory').value;
    const selectedMember = document.getElementById('individualMemberSelect').value;
    
    if (category === 'member-individual' && !selectedMember) {
        this.showMessage('Please select a member for individual report!', 'error');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const reportData = this.generateReportData(category, selectedMember);
        this.createPDFContent(doc, reportData);
        
        const fileName = `AI_T19_${reportData.fileName}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        this.showMessage(`✅ ${reportData.title} exported successfully!`, 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        this.showMessage('❌ PDF export failed. Please try again.', 'error');
    }
}

generateReportData(category, selectedMember = null) {
    const baseData = {
        generatedDate: new Date().toLocaleDateString(),
        totalMembers: this.members.length,
        teamName: 'AI T19'
    };

    switch(category) {
        case 'attendance':
            return {
                ...baseData,
                title: 'Attendance Report',
                fileName: 'Attendance_Report',
                type: 'attendance',
                data: this.getAttendanceData()
            };
            
        case 'tasks':
            return {
                ...baseData,
                title: 'Tasks Report', 
                fileName: 'Tasks_Report',
                type: 'tasks',
                data: this.getTasksData()
            };
            
        case 'ideas':
            return {
                ...baseData,
                title: 'Ideas Report',
                fileName: 'Ideas_Report', 
                type: 'ideas',
                data: this.getIdeasData()
            };
            
        case 'performance':
            return {
                ...baseData,
                title: 'Performance Analysis Report',
                fileName: 'Performance_Report',
                type: 'performance',
                data: this.getPerformanceData()
            };
            
        case 'member-individual':
            return {
                ...baseData,
                title: `Individual Report - ${selectedMember}`,
                fileName: `Individual_${selectedMember.replace(/\s+/g, '_')}`,
                type: 'individual',
                selectedMember: selectedMember,
                data: this.getIndividualMemberData(selectedMember)
            };
            
        default:
            return {
                ...baseData,
                title: 'Complete Team Report',
                fileName: 'Complete_Report',
                type: 'complete',
                data: this.getCompleteData()
            };
    }
}

// Report preview functionality
previewReport() {
    const category = document.getElementById('exportCategory').value;
    const selectedMember = document.getElementById('individualMemberSelect').value;
    
    if (category === 'member-individual' && !selectedMember) {
        this.showMessage('Please select a member for individual report preview!', 'error');
        return;
    }
    
    const reportData = this.generateReportData(category, selectedMember);
    this.displayReportPreview(reportData);
}

displayReportPreview(reportData) {
    const previewSection = document.getElementById('reportPreview');
    const previewContent = document.getElementById('reportPreviewContent');
    
    let html = `
        <div class="report-header">
            <h4>📋 ${reportData.title}</h4>
            <p><strong>Generated:</strong> ${reportData.generatedDate}</p>
            <p><strong>Team:</strong> ${reportData.teamName} (${reportData.totalMembers} members)</p>
        </div>
    `;
    
    // Add category-specific preview content
    switch(reportData.type) {
        case 'attendance':
            html += this.generateAttendancePreview(reportData.data);
            break;
        case 'tasks':
            html += this.generateTasksPreview(reportData.data);
            break;
        case 'ideas':
            html += this.generateIdeasPreview(reportData.data);
            break;
        case 'performance':
            html += this.generatePerformancePreview(reportData.data);
            break;
        case 'individual':
            html += this.generateIndividualPreview(reportData.data, reportData.selectedMember);
            break;
        case 'complete':
            html += this.generateCompletePreview(reportData.data);
            break;
    }
    
    previewContent.innerHTML = html;
    previewSection.style.display = 'block';
    
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Enhanced Event Listeners (ADD to existing setupEventListeners function)
// Add these to your existing setupEventListeners method:

const loadTasksBtn = document.getElementById('loadTasksBtn');
if (loadTasksBtn) {
    loadTasksBtn.addEventListener('click', () => this.loadMemberTasks());
}

const addNewTaskBtn = document.getElementById('addNewTaskBtn');
if (addNewTaskBtn) {
    addNewTaskBtn.addEventListener('click', () => this.addNewTask());
}

const exportCategory = document.getElementById('exportCategory');
if (exportCategory) {
    exportCategory.addEventListener('change', () => this.handleExportCategoryChange());
}

const exportCategoryPdfBtn = document.getElementById('exportCategoryPdfBtn');
if (exportCategoryPdfBtn) {
    exportCategoryPdfBtn.addEventListener('click', () => this.exportCategoryPDF());
}

const previewReportBtn = document.getElementById('previewReportBtn');
if (previewReportBtn) {
    previewReportBtn.addEventListener('click', () => this.previewReport());
}
