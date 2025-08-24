// Team Management System - Enhanced with sorting and member management
class TeamManager {
    constructor() {
        this.members = this.loadMembers();
        this.attendance = JSON.parse(localStorage.getItem('attendance')) || {};
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        this.ideas = JSON.parse(localStorage.getItem('ideas')) || [];
        this.isAdminLoggedIn = false;
        this.adminPassword = 'admin123';
        this.currentFilter = null;
        
        this.init();
    }

    loadMembers() {
        const savedMembers = JSON.parse(localStorage.getItem('members'));
        if (savedMembers && savedMembers.length > 0) {
            return savedMembers;
        }
        return [
            'Vasantha Kumar N', 'Dheeraj R', 'Gokul T', 'Siva Prasanth K',
            'Sanjay S', 'Rohith Vignesh N', 'Prabhu M', 'Prithivi Raj M',
            'Kamalesh R', 'Ashok Kumar S'
        ];
    }

    init() {
        this.setupEventListeners();
        this.populateSelects();
        this.setTodayDate();
        this.updateAllDisplays();
        this.setupSortControls();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                this.switchTab(targetTab);
            });
        });

        // Attendance functionality (removed mark all button)
        document.getElementById('markAttendanceBtn').addEventListener('click', () => {
            this.markAttendance();
        });

        // Task functionality
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.addTask();
        });

        // Ideas functionality
        document.getElementById('addIdeaBtn').addEventListener('click', () => {
            this.addIdea();
        });

        // Sort and filter controls
        document.getElementById('filterAttendanceBtn').addEventListener('click', () => {
            this.filterAttendance();
        });

        document.getElementById('sortTasksBtn').addEventListener('click', () => {
            this.sortTasks();
        });

        document.getElementById('sortIdeasBtn').addEventListener('click', () => {
            this.sortIdeas();
        });

        // PDF Export
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
        });

        // Radio button styling
        document.querySelectorAll('.radio-option').forEach(option => {
            option.addEventListener('click', () => {
                const radio = option.querySelector('input[type="radio"]');
                radio.checked = true;
                this.updateRadioStyles();
            });
        });

        // Admin functionality
        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            this.adminLogin();
        });

        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.adminLogin();
            }
        });

        // Member management
        document.getElementById('addMemberBtn').addEventListener('click', () => {
            this.addMember();
        });

        document.getElementById('newMemberName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addMember();
            }
        });

        // Admin panel buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportDataBtn') this.exportData();
            if (e.target.id === 'exportPdfAdminBtn') this.exportToPDF();
            if (e.target.id === 'clearDataBtn') this.clearAllData();
            if (e.target.id === 'resetAttendanceBtn') this.resetAttendance();
            if (e.target.id === 'logoutAdminBtn') this.logoutAdmin();
            if (e.target.id === 'importDataBtn') this.importData();
            if (e.target.classList.contains('delete-btn')) this.deleteIdea(e.target.dataset.id);
            if (e.target.classList.contains('remove-member-btn')) this.removeMember(e.target.dataset.member);
        });
    }

    setupSortControls() {
        // Setup sort type change handlers
        document.getElementById('sortType').addEventListener('change', (e) => {
            this.handleSortTypeChange(e.target.value);
        });

        // Set current year for year selector
        const currentYear = new Date().getFullYear();
        document.getElementById('yearInput').value = currentYear;
    }

    handleSortTypeChange(sortType) {
        const monthYearSelector = document.getElementById('monthYearSelector');
        const yearSelector = document.getElementById('yearSelector');
        
        monthYearSelector.style.display = 'none';
        yearSelector.style.display = 'none';
        
        if (sortType === 'month') {
            monthYearSelector.style.display = 'block';
            const currentMonth = new Date().toISOString().substring(0, 7);
            document.getElementById('monthYearInput').value = currentMonth;
        } else if (sortType === 'year') {
            yearSelector.style.display = 'block';
        }
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        
        // Add active class to selected nav tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update displays when switching tabs
        this.updateAllDisplays();
    }

    populateSelects() {
        const selects = ['attendanceMember', 'memberSelect', 'ideaMember'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">Select a member...</option>';
            this.members.forEach(member => {
                const option = document.createElement('option');
                option.value = member;
                option.textContent = member;
                select.appendChild(option);
            });
        });
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('sessionDate').value = today;
    }

    markAttendance() {
        const date = document.getElementById('sessionDate').value;
        const member = document.getElementById('attendanceMember').value;
        const status = document.querySelector('input[name="attendanceStatus"]:checked')?.value;

        if (!date || !member || !status) {
            this.showMessage('Please fill all fields!', 'error');
            return;
        }

        if (!this.attendance[date]) {
            this.attendance[date] = {};
        }

        this.attendance[date][member] = status;
        this.saveData();
        this.updateAllDisplays();
        this.showMessage(`Attendance marked: ${member} - ${status}`, 'success');

        // Reset form
        document.getElementById('attendanceMember').value = '';
        document.querySelectorAll('input[name="attendanceStatus"]').forEach(radio => {
            radio.checked = false;
        });
        this.updateRadioStyles();
    }

    filterAttendance() {
        const sortType = document.getElementById('sortType').value;
        let filteredData = {};
        let filterInfo = '';

        if (sortType === 'date') {
            // Show all dates, sorted by date
            const dates = Object.keys(this.attendance).sort();
            dates.forEach(date => {
                filteredData[date] = this.attendance[date];
            });
            filterInfo = 'Showing all attendance records sorted by date';
        } else if (sortType === 'month') {
            const selectedMonth = document.getElementById('monthYearInput').value;
            if (!selectedMonth) {
                this.showMessage('Please select a month!', 'error');
                return;
            }
            
            Object.keys(this.attendance).forEach(date => {
                if (date.startsWith(selectedMonth)) {
                    filteredData[date] = this.attendance[date];
                }
            });
            
            const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
            });
            filterInfo = `Showing attendance records for ${monthName}`;
        } else if (sortType === 'year') {
            const selectedYear = document.getElementById('yearInput').value;
            if (!selectedYear) {
                this.showMessage('Please select a year!', 'error');
                return;
            }
            
            Object.keys(this.attendance).forEach(date => {
                if (date.startsWith(selectedYear)) {
                    filteredData[date] = this.attendance[date];
                }
            });
            
            filterInfo = `Showing attendance records for ${selectedYear}`;
        }

        this.currentFilter = { type: sortType, data: filteredData, info: filterInfo };
        this.updateAttendanceDisplay();
    }

    sortTasks() {
        const sortType = document.getElementById('taskSortType').value;
        this.updateTasksDisplay(sortType);
    }

    sortIdeas() {
        const sortType = document.getElementById('ideaSortType').value;
        this.updateIdeasDisplay(sortType);
    }

    addTask() {
        const member = document.getElementById('memberSelect').value;
        const description = document.getElementById('taskDescription').value;

        if (!member || !description.trim()) {
            this.showMessage('Please select member and add task description!', 'error');
            return;
        }

        const taskId = Date.now().toString();
        const task = {
            id: taskId,
            member: member,
            description: description.trim(),
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString()
        };

        if (!this.tasks[member]) {
            this.tasks[member] = [];
        }

        this.tasks[member].unshift(task);
        this.saveData();
        this.updateTasksDisplay();
        this.updateOverviewStats();
        this.showMessage('Task added successfully!', 'success');

        // Reset form
        document.getElementById('memberSelect').value = '';
        document.getElementById('taskDescription').value = '';
    }

    addIdea() {
        const member = document.getElementById('ideaMember').value;
        const content = document.getElementById('ideaContent').value;

        if (!member || !content.trim()) {
            this.showMessage('Please select your name and add idea content!', 'error');
            return;
        }

        const idea = {
            id: Date.now().toString(),
            member: member,
            content: content.trim(),
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString()
        };

        this.ideas.unshift(idea);
        this.saveData();
        this.updateIdeasDisplay();
        this.updateOverviewStats();
        this.showMessage('Idea shared successfully!', 'success');

        // Reset form
        document.getElementById('ideaMember').value = '';
        document.getElementById('ideaContent').value = '';
    }

    deleteIdea(ideaId) {
        if (confirm('Are you sure you want to delete this idea?')) {
            this.ideas = this.ideas.filter(idea => idea.id !== ideaId);
            this.saveData();
            this.updateIdeasDisplay();
            this.updateOverviewStats();
            this.showMessage('Idea deleted successfully!', 'success');
        }
    }

    // Member Management Functions
    addMember() {
        const memberName = document.getElementById('newMemberName').value.trim();
        
        if (!memberName) {
            this.showMessage('Please enter a member name!', 'error');
            return;
        }

        if (this.members.includes(memberName)) {
            this.showMessage('Member already exists!', 'error');
            return;
        }

        this.members.push(memberName);
        this.saveData();
        this.populateSelects();
        this.updateMembersList();
        this.updateAllDisplays();
        
        document.getElementById('newMemberName').value = '';
        this.showMessage(`Member "${memberName}" added successfully!`, 'success');
    }

    removeMember(memberName) {
        if (confirm(`Are you sure you want to remove "${memberName}" from the team? This will also remove all their data.`)) {
            // Remove member from list
            this.members = this.members.filter(member => member !== memberName);
            
            // Remove member's tasks
            delete this.tasks[memberName];
            
            // Remove member's ideas
            this.ideas = this.ideas.filter(idea => idea.member !== memberName);
            
            // Remove member from attendance records
            Object.keys(this.attendance).forEach(date => {
                delete this.attendance[date][memberName];
            });
            
            this.saveData();
            this.populateSelects();
            this.updateMembersList();
            this.updateAllDisplays();
            this.showMessage(`Member "${memberName}" removed successfully!`, 'success');
        }
    }

    updateMembersList() {
        const membersList = document.querySelector('#admin .members-list');
        if (!membersList) return;
        
        membersList.innerHTML = '';
        
        this.members.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            memberItem.innerHTML = `
                <span class="member-name">${member}</span>
                <button class="remove-member-btn" data-member="${member}" title="Remove ${member}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            membersList.appendChild(memberItem);
        });
    }

    updateAllDisplays() {
        this.updateAttendanceDisplay();
        this.updateTasksDisplay();
        this.updateIdeasDisplay();
        this.updateOverviewStats();
        this.updateMembersList();
    }

    updateAttendanceDisplay() {
        const date = document.getElementById('sessionDate').value;
        let displayData = {};
        let showFilterInfo = false;

        if (this.currentFilter) {
            displayData = this.currentFilter.data;
            showFilterInfo = true;
        } else {
            displayData[date] = this.attendance[date] || {};
        }

        const membersList = document.getElementById('membersList');
        membersList.innerHTML = '';

        if (showFilterInfo) {
            const filterInfo = document.createElement('div');
            filterInfo.className = 'filter-info';
            filterInfo.innerHTML = `<i class="fas fa-info-circle"></i> ${this.currentFilter.info}`;
            membersList.appendChild(filterInfo);
        }

        // Calculate stats for current date view
        const dailyAttendance = this.attendance[date] || {};
        let presentCount = 0;
        let absentCount = 0;
        let notMarkedCount = 0;

        this.members.forEach(member => {
            const status = dailyAttendance[member] || 'not-marked';
            if (status === 'present') presentCount++;
            else if (status === 'absent') absentCount++;
            else notMarkedCount++;
        });

        // Update stats
        document.getElementById('presentCount').textContent = presentCount;
        document.getElementById('absentCount').textContent = absentCount;
        document.getElementById('notMarkedCount').textContent = notMarkedCount;
        
        const attendanceRate = this.members.length > 0 ? 
            Math.round((presentCount / this.members.length) * 100) : 0;
        document.getElementById('attendanceRate').textContent = attendanceRate + '%';

        // Display attendance records
        const sortedDates = Object.keys(displayData).sort().reverse();
        
        sortedDates.forEach(displayDate => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'attendance-date-group';
            
            const dateAttendance = displayData[displayDate];
            const dayPresent = Object.values(dateAttendance).filter(s => s === 'present').length;
            const dayAbsent = Object.values(dateAttendance).filter(s => s === 'absent').length;
            const dayTotal = Object.keys(dateAttendance).length;
            const dayRate = dayTotal > 0 ? Math.round((dayPresent / this.members.length) * 100) : 0;
            
            dateGroup.innerHTML = `
                <div class="date-header">
                    <span><i class="fas fa-calendar-day"></i> ${new Date(displayDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                    <span class="date-stats">
                        Present: ${dayPresent} | Absent: ${dayAbsent} | Rate: ${dayRate}%
                    </span>
                </div>
                <div class="members-grid" style="padding: 24px;">
                    ${this.members.map(member => {
                        const status = dateAttendance[member] || 'not-marked';
                        return `
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
                    }).join('')}
                </div>
            `;
            
            membersList.appendChild(dateGroup);
        });

        if (sortedDates.length === 0) {
            membersList.innerHTML += `
                <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p>No attendance records found for the selected period.</p>
                </div>
            `;
        }
    }

    updateTasksDisplay(sortType = 'newest') {
        const tasksDisplay = document.getElementById('tasksDisplay');
        tasksDisplay.innerHTML = '';

        let allTasks = [];
        
        // Collect all tasks
        Object.keys(this.tasks).forEach(member => {
            this.tasks[member].forEach(task => {
                allTasks.push({ ...task, member });
            });
        });

        // Sort tasks based on type
        switch (sortType) {
            case 'newest':
                allTasks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'oldest':
                allTasks.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'member':
                allTasks.sort((a, b) => a.member.localeCompare(b.member));
                break;
        }

        if (sortType === 'member') {
            // Group by member
            this.members.forEach(member => {
                const memberTasks = allTasks.filter(task => task.member === member);
                if (memberTasks.length === 0) return;

                const memberCard = document.createElement('div');
                memberCard.className = 'member-card';
                
                const tasksHTML = memberTasks.map(task => `
                    <div class="task-item">
                        <strong>${task.date}:</strong> ${task.description}
                    </div>
                `).join('');

                memberCard.innerHTML = `
                    <div class="member-header">
                        <div class="member-name">${member}</div>
                        <div class="status-badge" style="background: var(--info);">
                            ${memberTasks.length} Tasks
                        </div>
                    </div>
                    <div class="task-list">${tasksHTML}</div>
                `;
                
                tasksDisplay.appendChild(memberCard);
            });
        } else {
            // Show all tasks in chronological order
            const tasksList = document.createElement('div');
            tasksList.style.cssText = 'display: grid; gap: 16px;';
            
            allTasks.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = 'member-card';
                taskCard.innerHTML = `
                    <div class="member-header">
                        <div class="member-name">${task.member}</div>
                        <div class="status-badge" style="background: var(--success);">
                            ${task.date}
                        </div>
                    </div>
                    <div class="task-item" style="margin-top: 16px;">
                        ${task.description}
                    </div>
                `;
                tasksList.appendChild(taskCard);
            });
            
            tasksDisplay.appendChild(tasksList);
        }

        if (allTasks.length === 0) {
            tasksDisplay.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray-500);">
                    <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p>No tasks recorded yet. Start adding completed tasks!</p>
                </div>
            `;
        }
    }

    updateIdeasDisplay(sortType = 'newest') {
        const ideasBoard = document.getElementById('ideasBoard');
        ideasBoard.innerHTML = '';

        if (this.ideas.length === 0) {
            ideasBoard.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray-500);">
                    <i class="fas fa-lightbulb" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p>No ideas shared yet. Be the first to share your innovative thoughts!</p>
                </div>
            `;
            return;
        }

        let sortedIdeas = [...this.ideas];

        // Sort ideas based on type
        switch (sortType) {
            case 'newest':
                sortedIdeas.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'oldest':
                sortedIdeas.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'member':
                sortedIdeas.sort((a, b) => a.member.localeCompare(b.member));
                break;
        }

        sortedIdeas.forEach(idea => {
            const ideaCard = document.createElement('div');
            ideaCard.className = 'idea-card';
            ideaCard.innerHTML = `
                <button class="delete-btn" data-id="${idea.id}">
                    <i class="fas fa-times"></i>
                </button>
                <div class="idea-author">${idea.member} - ${idea.date}</div>
                <div class="idea-content">${idea.content}</div>
            `;
            ideasBoard.appendChild(ideaCard);
        });
    }

    updateOverviewStats() {
        const totalTasks = Object.values(this.tasks).reduce((total, memberTasks) => 
            total + memberTasks.length, 0);
        
        const totalIdeas = this.ideas.length;
        
        const attendanceDates = Object.keys(this.attendance);
        const activeDays = attendanceDates.length;
        
        let totalAttendanceRate = 0;
        if (attendanceDates.length > 0) {
            const rates = attendanceDates.map(date => {
                const dayAttendance = this.attendance[date];
                const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
                return (presentCount / this.members.length) * 100;
            });
            totalAttendanceRate = Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
        }

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('totalIdeas').textContent = totalIdeas;
        document.getElementById('avgAttendance').textContent = totalAttendanceRate + '%';
        document.getElementById('activeDays').textContent = activeDays;

        this.updatePerformanceSummary();
    }

    updatePerformanceSummary() {
        const performanceSummary = document.getElementById('performanceSummary');
        
        // Calculate member statistics
        const memberStats = this.members.map(member => {
            const taskCount = this.tasks[member] ? this.tasks[member].length : 0;
            const ideaCount = this.ideas.filter(idea => idea.member === member).length;
            
            let attendanceCount = 0;
            Object.values(this.attendance).forEach(dayAttendance => {
                if (dayAttendance[member] === 'present') attendanceCount++;
            });
            
            const totalDays = Object.keys(this.attendance).length;
            const attendanceRate = totalDays > 0 ? (attendanceCount / totalDays) * 100 : 0;
            
            return {
                name: member,
                tasks: taskCount,
                ideas: ideaCount,
                attendanceRate: Math.round(attendanceRate),
                totalScore: taskCount + ideaCount + (attendanceRate / 10)
            };
        });

        memberStats.sort((a, b) => b.totalScore - a.totalScore);

        performanceSummary.innerHTML = `
            <h3 style="margin-bottom: 24px; color: var(--gray-900);">
                <i class="fas fa-trophy"></i> Performance Summary
            </h3>
            <div class="members-grid">
                ${memberStats.slice(0, 6).map((member, index) => `
                    <div class="member-card">
                        <div class="member-header">
                            <div class="member-name">
                                ${index < 3 ? `<i class="fas fa-medal" style="color: ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'}; margin-right: 8px;"></i>` : ''}
                                ${member.name}
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px;">
                            <div style="text-align: center; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${member.tasks}</div>
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
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateRadioStyles() {
        document.querySelectorAll('.radio-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    // PDF Export functionality
    async exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('AI T19 - Team Management Report', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        
        let yPosition = 50;
        
        // Add team statistics
        doc.setFontSize(16);
        doc.text('Team Statistics', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        const totalTasks = Object.values(this.tasks).reduce((total, memberTasks) => total + memberTasks.length, 0);
        const totalIdeas = this.ideas.length;
        const activeDays = Object.keys(this.attendance).length;
        
        doc.text(`Total Team Members: ${this.members.length}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Total Tasks Completed: ${totalTasks}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Total Ideas Shared: ${totalIdeas}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Active Days: ${activeDays}`, 20, yPosition);
        yPosition += 15;
        
        // Add member performance
        doc.setFontSize(16);
        doc.text('Member Performance', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        const memberStats = this.members.map(member => {
            const taskCount = this.tasks[member] ? this.tasks[member].length : 0;
            const ideaCount = this.ideas.filter(idea => idea.member === member).length;
            
            let attendanceCount = 0;
            Object.values(this.attendance).forEach(dayAttendance => {
                if (dayAttendance[member] === 'present') attendanceCount++;
            });
            
            const totalDays = Object.keys(this.attendance).length;
            const attendanceRate = totalDays > 0 ? Math.round((attendanceCount / totalDays) * 100) : 0;
            
            return { name: member, tasks: taskCount, ideas: ideaCount, attendanceRate };
        });
        
        memberStats.forEach(member => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(`${member.name}:`, 20, yPosition);
            doc.text(`Tasks: ${member.tasks} | Ideas: ${member.ideas} | Attendance: ${member.attendanceRate}%`, 30, yPosition + 5);
            yPosition += 15;
        });
        
        // Add recent attendance (last 10 days)
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(16);
        doc.text('Recent Attendance (Last 10 Records)', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        const recentDates = Object.keys(this.attendance).sort().slice(-10);
        
        recentDates.forEach(date => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            const dayAttendance = this.attendance[date];
            const presentCount = Object.values(dayAttendance).filter(s => s === 'present').length;
            const rate = Math.round((presentCount / this.members.length) * 100);
            
            doc.text(`${date}: ${presentCount}/${this.members.length} present (${rate}%)`, 20, yPosition);
            yPosition += 8;
        });
        
        // Save the PDF
        const fileName = `AI_T19_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        this.showMessage('PDF report generated successfully!', 'success');
    }

    adminLogin() {
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminError');
        
        if (password === this.adminPassword) {
            this.isAdminLoggedIn = true;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            errorDiv.style.display = 'none';
            this.updateMembersList();
            this.showMessage('Admin access granted!', 'success');
        } else {
            errorDiv.style.display = 'block';
            document.getElementById('adminPassword').value = '';
        }
    }

    logoutAdmin() {
        this.isAdminLoggedIn = false;
        document.getElementById('adminLogin').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminPassword').value = '';
        this.showMessage('Admin logged out successfully!', 'success');
    }

    exportData() {
        const data = {
            members: this.members,
            attendance: this.attendance,
            tasks: this.tasks,
            ideas: this.ideas,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team_management_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Data exported successfully!', 'success');
    }

    importData() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showMessage('Please select a file to import!', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.members && data.attendance && data.tasks && data.ideas) {
                    this.members = data.members;
                    this.attendance = data.attendance;
                    this.tasks = data.tasks;
                    this.ideas = data.ideas;
                    
                    this.saveData();
                    this.populateSelects();
                    this.updateAllDisplays();
                    
                    this.showMessage('Data imported successfully!', 'success');
                    fileInput.value = '';
                } else {
                    this.showMessage('Invalid file format!', 'error');
                }
            } catch (error) {
                this.showMessage('Error reading file!', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
            this.attendance = {};
            this.tasks = {};
            this.ideas = [];
            
            this.saveData();
            this.updateAllDisplays();
            this.showMessage('All data cleared successfully!', 'success');
        }
    }

    resetAttendance() {
        if (confirm('Are you sure you want to reset all attendance data?')) {
            this.attendance = {};
            this.saveData();
            this.updateAttendanceDisplay();
            this.updateOverviewStats();
            this.showMessage('Attendance data reset successfully!', 'success');
        }
    }

    saveData() {
        localStorage.setItem('members', JSON.stringify(this.members));
        localStorage.setItem('attendance', JSON.stringify(this.attendance));
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('ideas', JSON.stringify(this.ideas));
    }

    showMessage(message, type = 'success') {
        const messageContainer = document.getElementById('messageContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TeamManager();
});
