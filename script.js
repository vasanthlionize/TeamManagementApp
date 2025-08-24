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

// Enhanced Team Manager Class with Category PDF Support
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
        
        this.init();
    }

    init() {
        console.log('🚀 Starting Enhanced Team Manager...');
        this.updateConnectionStatus('🔄 Initializing Firebase...', 'connecting');
        
        this.initializeFirebase().then(() => {
            this.setupEventListeners();
            this.populateSelects();
            this.setTodayDate();
            this.loadLocalData();
            this.updateAllDisplays();
            this.updateConnectionStatus('✅ App Ready', 'online');
            this.showMessage('✅ Team Management System Ready with Category Reports!', 'success');
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
                
                this.database.ref('.info/connected').on('value', (snapshot) => {
                    clearTimeout(timeout);
                    this.isOnline = snapshot.val();
                    
                    if (this.isOnline) {
                        this.updateConnectionStatus('🟢 Online - Firebase Connected', 'online');
                        this.setupFirebaseListeners();
                        this.syncToFirebase();
                    }
                    resolve();
                });
            });
        } catch (error) {
            throw error;
        }
    }

    setupFirebaseListeners() {
        if (!this.database) return;
        
        const teamRef = this.database.ref(`teams/${this.teamId}`);
        
        teamRef.child('tasks').on('value', (snapshot) => {
            if (snapshot.exists()) {
                this.tasks = snapshot.val();
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
    }

    setupEventListeners() {
        console.log('🔧 Setting up enhanced event listeners...');
        
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

        // Category Export Selection Change
        const exportCategory = document.getElementById('exportCategory');
        if (exportCategory) {
            exportCategory.addEventListener('change', () => this.handleExportCategoryChange());
        }

        // Enhanced PDF Export
        const exportCategoryPdfBtn = document.getElementById('exportCategoryPdfBtn');
        if (exportCategoryPdfBtn) {
            exportCategoryPdfBtn.addEventListener('click', () => this.exportCategoryPDF());
        }

        const previewReportBtn = document.getElementById('previewReportBtn');
        if (previewReportBtn) {
            previewReportBtn.addEventListener('click', () => this.previewReport());
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

        console.log('✅ Enhanced event listeners ready');
    }

    // Handle Export Category Change
    handleExportCategoryChange() {
        const category = document.getElementById('exportCategory').value;
        const memberSelectGroup = document.getElementById('memberSelectGroup');
        
        if (category === 'member-individual') {
            memberSelectGroup.style.display = 'block';
        } else {
            memberSelectGroup.style.display = 'none';
        }
    }

    // Enhanced Category-wise PDF Export
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
            
            // Generate report based on category
            const reportData = this.generateReportData(category, selectedMember);
            this.createPDFContent(doc, reportData);
            
            const fileName = `AI_T19_${reportData.fileName}_${new Date().toISOString().split('T')}.pdf`;
            doc.save(fileName);
            
            this.showMessage(`✅ ${reportData.title} exported successfully!`, 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            this.showMessage('❌ PDF export failed. Please try again.', 'error');
        }
    }

    // Generate Report Data Based on Category
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
                
            default: // 'all'
                return {
                    ...baseData,
                    title: 'Complete Team Report',
                    fileName: 'Complete_Report',
                    type: 'complete',
                    data: this.getCompleteData()
                };
        }
    }

    // Data Collection Methods
    getAttendanceData() {
        const attendanceDates = Object.keys(this.attendance).sort();
        const summary = {};
        let totalPresentDays = 0;
        let totalDays = attendanceDates.length * this.members.length;
        
        attendanceDates.forEach(date => {
            const dayAttendance = this.attendance[date];
            const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
            const rate = Math.round((presentCount / this.members.length) * 100);
            
            summary[date] = {
                present: presentCount,
                absent: Object.values(dayAttendance).filter(status => status === 'absent').length,
                rate: rate
            };
            totalPresentDays += presentCount;
        });
        
        return {
            dailySummary: summary,
            overallRate: totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0,
            totalActiveDays: attendanceDates.length,
            memberWiseStats: this.getMemberWiseAttendance()
        };
    }

    getMemberWiseAttendance() {
        const memberStats = {};
        this.members.forEach(member => {
            let presentCount = 0;
            let totalDays = 0;
            
            Object.values(this.attendance).forEach(dayAttendance => {
                if (dayAttendance[member]) {
                    totalDays++;
                    if (dayAttendance[member] === 'present') presentCount++;
                }
            });
            
            memberStats[member] = {
                present: presentCount,
                total: totalDays,
                rate: totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0
            };
        });
        
        return memberStats;
    }

    getTasksData() {
        const regularTasks = Object.values(this.tasks).reduce((total, memberTasks) => total + memberTasks.length, 0);
        const assignedTasks = Object.values(this.assignedTasks).reduce((total, memberTasks) => total + memberTasks.length, 0);
        const completedAssigned = Object.values(this.assignedTasks).reduce((total, memberTasks) => 
            total + memberTasks.filter(task => task.status === 'completed').length, 0);
        
        return {
            totalRegular: regularTasks,
            totalAssigned: assignedTasks,
            completedAssigned: completedAssigned,
            memberWiseTasks: this.getMemberWiseTaskData()
        };
    }

    getMemberWiseTaskData() {
        const memberData = {};
        this.members.forEach(member => {
            const regularTasks = this.tasks[member] || [];
            const assignedTasks = this.assignedTasks[member] || [];
            const completedAssigned = assignedTasks.filter(task => task.status === 'completed').length;
            
            memberData[member] = {
                regular: regularTasks.length,
                assigned: assignedTasks.length,
                completed: completedAssigned,
                recentTasks: regularTasks.slice(0, 5) // Last 5 tasks
            };
        });
        
        return memberData;
    }

    getIdeasData() {
        const memberWiseIdeas = {};
        this.members.forEach(member => {
            const memberIdeas = this.ideas.filter(idea => idea.member === member);
            memberWiseIdeas[member] = {
                count: memberIdeas.length,
                ideas: memberIdeas.slice(0, 3) // Top 3 recent ideas
            };
        });
        
        return {
            totalIdeas: this.ideas.length,
            memberWiseIdeas: memberWiseIdeas,
            recentIdeas: this.ideas.slice(0, 10)
        };
    }

    getPerformanceData() {
        const memberStats = this.members.map(member => {
            const taskCount = this.tasks[member] ? this.tasks[member].length : 0;
            const ideaCount = this.ideas.filter(idea => idea.member === member).length;
            const assignedTasks = this.assignedTasks[member] || [];
            const completedAssigned = assignedTasks.filter(task => task.status === 'completed').length;
            
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
                assignedCompleted: completedAssigned,
                attendanceRate: Math.round(attendanceRate),
                totalScore: taskCount + ideaCount + (attendanceRate / 10) + completedAssigned * 2
            };
        });

        return {
            rankings: memberStats.sort((a, b) => b.totalScore - a.totalScore),
            teamAverages: {
                avgTasks: Math.round(memberStats.reduce((sum, m) => sum + m.tasks, 0) / memberStats.length),
                avgIdeas: Math.round(memberStats.reduce((sum, m) => sum + m.ideas, 0) / memberStats.length),
                avgAttendance: Math.round(memberStats.reduce((sum, m) => sum + m.attendanceRate, 0) / memberStats.length)
            }
        };
    }

    getIndividualMemberData(memberName) {
        const memberTasks = this.tasks[memberName] || [];
        const memberIdeas = this.ideas.filter(idea => idea.member === memberName);
        const memberAssigned = this.assignedTasks[memberName] || [];
        
        let attendanceCount = 0;
        const attendanceDetails = {};
        Object.keys(this.attendance).forEach(date => {
            const status = this.attendance[date][memberName] || 'not-marked';
            attendanceDetails[date] = status;
            if (status === 'present') attendanceCount++;
        });
        
        const totalDays = Object.keys(this.attendance).length;
        
        return {
            tasks: memberTasks,
            ideas: memberIdeas,
            assignedTasks: memberAssigned,
            attendanceDetails: attendanceDetails,
            summary: {
                totalTasks: memberTasks.length,
                totalIdeas: memberIdeas.length,
                totalAssigned: memberAssigned.length,
                completedAssigned: memberAssigned.filter(task => task.status === 'completed').length,
                attendanceRate: totalDays > 0 ? Math.round((attendanceCount / totalDays) * 100) : 0
            }
        };
    }

    getCompleteData() {
        return {
            attendance: this.getAttendanceData(),
            tasks: this.getTasksData(),
            ideas: this.getIdeasData(),
            performance: this.getPerformanceData()
        };
    }

    // PDF Content Creation
    createPDFContent(doc, reportData) {
        // Header
        doc.setFontSize(20);
        doc.text(reportData.title, 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Team: ${reportData.teamName}`, 20, 35);
        doc.text(`Generated: ${reportData.generatedDate}`, 20, 45);
        doc.text(`Total Members: ${reportData.totalMembers}`, 20, 55);
        
        let yPos = 70;
        
        // Content based on report type
        switch(reportData.type) {
            case 'attendance':
                yPos = this.addAttendanceContentToPDF(doc, reportData.data, yPos);
                break;
            case 'tasks':
                yPos = this.addTasksContentToPDF(doc, reportData.data, yPos);
                break;
            case 'ideas':
                yPos = this.addIdeasContentToPDF(doc, reportData.data, yPos);
                break;
            case 'performance':
                yPos = this.addPerformanceContentToPDF(doc, reportData.data, yPos);
                break;
            case 'individual':
                yPos = this.addIndividualContentToPDF(doc, reportData.data, reportData.selectedMember, yPos);
                break;
            case 'complete':
                yPos = this.addCompleteContentToPDF(doc, reportData.data, yPos);
                break;
        }
    }

    addAttendanceContentToPDF(doc, data, yPos) {
        doc.setFontSize(16);
        doc.text('Attendance Summary', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.text(`Overall Attendance Rate: ${data.overallRate}%`, 20, yPos);
        yPos += 8;
        doc.text(`Total Active Days: ${data.totalActiveDays}`, 20, yPos);
        yPos += 15;
        
        // Member-wise stats
        doc.setFontSize(14);
        doc.text('Member-wise Attendance:', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        Object.keys(data.memberWiseStats).forEach(member => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            const stats = data.memberWiseStats[member];
            doc.text(`${member}: ${stats.present}/${stats.total} days (${stats.rate}%)`, 25, yPos);
            yPos += 6;
        });
        
        return yPos + 10;
    }

    addTasksContentToPDF(doc, data, yPos) {
        doc.setFontSize(16);
        doc.text('Tasks Summary', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.text(`Total Regular Tasks: ${data.totalRegular}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Assigned Tasks: ${data.totalAssigned}`, 20, yPos);
        yPos += 8;
        doc.text(`Completed Assigned Tasks: ${data.completedAssigned}`, 20, yPos);
        yPos += 15;
        
        // Member-wise tasks
        doc.setFontSize(14);
        doc.text('Member-wise Task Summary:', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        Object.keys(data.memberWiseTasks).forEach(member => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            const tasks = data.memberWiseTasks[member];
            doc.text(`${member}:`, 25, yPos);
            yPos += 6;
            doc.text(`  Regular: ${tasks.regular} | Assigned: ${tasks.completed}/${tasks.assigned}`, 30, yPos);
            yPos += 8;
        });
        
        return yPos + 10;
    }

    addIdeasContentToPDF(doc, data, yPos) {
        doc.setFontSize(16);
        doc.text('Ideas Summary', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.text(`Total Ideas Shared: ${data.totalIdeas}`, 20, yPos);
        yPos += 15;
        
        // Member-wise ideas
        doc.setFontSize(14);
        doc.text('Member-wise Ideas:', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        Object.keys(data.memberWiseIdeas).forEach(member => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            const memberData = data.memberWiseIdeas[member];
            doc.text(`${member}: ${memberData.count} ideas`, 25, yPos);
            yPos += 8;
        });
        
        return yPos + 10;
    }

    addPerformanceContentToPDF(doc, data, yPos) {
        doc.setFontSize(16);
        doc.text('Performance Analysis', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.text('Team Rankings:', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        data.rankings.slice(0, 10).forEach((member, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(`${index + 1}. ${member.name} - Score: ${Math.round(member.totalScore)}`, 25, yPos);
            yPos += 6;
            doc.text(`   Tasks: ${member.tasks} | Ideas: ${member.ideas} | Attendance: ${member.attendanceRate}%`, 30, yPos);
            yPos += 8;
        });
        
        return yPos + 10;
    }

    addIndividualContentToPDF(doc, data, memberName, yPos) {
        doc.setFontSize(16);
        doc.text(`Individual Report: ${memberName}`, 20, yPos);
        yPos += 15;
        
        doc.setFontSize(14);
        doc.text('Summary:', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(12);
        doc.text(`Regular Tasks: ${data.summary.totalTasks}`, 25, yPos);
        yPos += 8;
        doc.text(`Ideas Shared: ${data.summary.totalIdeas}`, 25, yPos);
        yPos += 8;
        doc.text(`Assigned Tasks: ${data.summary.completedAssigned}/${data.summary.totalAssigned}`, 25, yPos);
        yPos += 8;
        doc.text(`Attendance Rate: ${data.summary.attendanceRate}%`, 25, yPos);
        yPos += 15;
        
        // Recent tasks
        if (data.tasks.length > 0) {
            doc.setFontSize(14);
            doc.text('Recent Tasks:', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            data.tasks.slice(0, 10).forEach(task => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`• ${task.date}: ${task.description.substring(0, 60)}...`, 25, yPos);
                yPos += 6;
            });
        }
        
        return yPos + 10;
    }

    addCompleteContentToPDF(doc, data, yPos) {
        // Add summary from each category
        yPos = this.addAttendanceContentToPDF(doc, data.attendance, yPos);
        yPos = this.addTasksContentToPDF(doc, data.tasks, yPos);
        yPos = this.addIdeasContentToPDF(doc, data.ideas, yPos);
        yPos = this.addPerformanceContentToPDF(doc, data.performance, yPos);
        
        return yPos;
    }

    // Preview Report
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
                <h4>${reportData.title}</h4>
                <p><strong>Generated:</strong> ${reportData.generatedDate}</p>
                <p><strong>Team:</strong> ${reportData.teamName} (${reportData.totalMembers} members)</p>
            </div>
        `;
        
        // Add content preview based on type
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
        
        // Scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    generateAttendancePreview(data) {
        return `
            <div class="preview-section">
                <h5>📊 Attendance Overview</h5>
                <p><strong>Overall Rate:</strong> ${data.overallRate}%</p>
                <p><strong>Active Days:</strong> ${data.totalActiveDays}</p>
                <div class="member-stats">
                    <h6>Top Performers:</h6>
                    ${Object.entries(data.memberWiseStats)
                        .sort(([,a], [,b]) => b.rate - a.rate)
                        .slice(0, 5)
                        .map(([member, stats]) => `<p>${member}: ${stats.rate}%</p>`)
                        .join('')}
                </div>
            </div>
        `;
    }

    generateTasksPreview(data) {
        return `
            <div class="preview-section">
                <h5>📋 Tasks Overview</h5>
                <p><strong>Regular Tasks:</strong> ${data.totalRegular}</p>
                <p><strong>Assigned Tasks:</strong> ${data.completedAssigned}/${data.totalAssigned}</p>
                <div class="member-stats">
                    <h6>Most Active Members:</h6>
                    ${Object.entries(data.memberWiseTasks)
                        .sort(([,a], [,b]) => (b.regular + b.completed) - (a.regular + a.completed))
                        .slice(0, 5)
                        .map(([member, tasks]) => `<p>${member}: ${tasks.regular + tasks.completed} total</p>`)
                        .join('')}
                </div>
            </div>
        `;
    }

    generateIdeasPreview(data) {
        return `
            <div class="preview-section">
                <h5>💡 Ideas Overview</h5>
                <p><strong>Total Ideas:</strong> ${data.totalIdeas}</p>
                <div class="member-stats">
                    <h6>Top Contributors:</h6>
                    ${Object.entries(data.memberWiseIdeas)
                        .sort(([,a], [,b]) => b.count - a.count)
                        .slice(0, 5)
                        .map(([member, ideas]) => `<p>${member}: ${ideas.count} ideas</p>`)
                        .join('')}
                </div>
            </div>
        `;
    }

    generatePerformancePreview(data) {
        return `
            <div class="preview-section">
                <h5>🏆 Performance Overview</h5>
                <div class="rankings">
                    <h6>Top 5 Performers:</h6>
                    ${data.rankings.slice(0, 5).map((member, index) => `
                        <div class="rank-item">
                            <strong>${index + 1}. ${member.name}</strong>
                            <span>Score: ${Math.round(member.totalScore)}</span>
                            <small>Tasks: ${member.tasks} | Ideas: ${member.ideas} | Attendance: ${member.attendanceRate}%</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    generateIndividualPreview(data, memberName) {
        return `
            <div class="preview-section">
                <h5>👤 Individual Report: ${memberName}</h5>
                <div class="individual-stats">
                    <p><strong>Regular Tasks:</strong> ${data.summary.totalTasks}</p>
                    <p><strong>Ideas Shared:</strong> ${data.summary.totalIdeas}</p>
                    <p><strong>Assigned Tasks:</strong> ${data.summary.completedAssigned}/${data.summary.totalAssigned}</p>
                    <p><strong>Attendance Rate:</strong> ${data.summary.attendanceRate}%</p>
                </div>
            </div>
        `;
    }

    generateCompletePreview(data) {
        return `
            <div class="preview-section">
                <h5>📊 Complete Report Preview</h5>
                <p>This report includes:</p>
                <ul>
                    <li>📊 Attendance Analysis (${data.attendance.overallRate}% overall rate)</li>
                    <li>📋 Tasks Summary (${data.tasks.totalRegular + data.tasks.totalAssigned} total tasks)</li>
                    <li>💡 Ideas Collection (${data.ideas.totalIdeas} ideas)</li>
                    <li>🏆 Performance Rankings (${data.performance.rankings.length} members)</li>
                </ul>
            </div>
        `;
    }

    // [Include all other existing methods from previous version...]
    // Task Management, Attendance, Ideas, Admin functions, etc.

    // Simplified Task Loading
    loadMemberTasks() {
        const selectedMember = document.getElementById('taskMemberSelect').value;
        if (!selectedMember) {
            this.showMessage('Please select a member!', 'error');
            return;
        }

        this.currentSelectedMember = selectedMember;
        this.displayMemberTasks(selectedMember);
        this.showMessage(`✅ Loaded tasks for ${selectedMember}`, 'success');
    }

    displayMemberTasks(memberName) {
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

    // [Include all other existing methods - attendance, ideas, admin, data management, etc.]
    async markAttendance() {
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

    async saveData(dataType, data) {
        localStorage.setItem(dataType, JSON.stringify(data));
        
        if (this.isOnline && this.database) {
            try {
                await this.database.ref(`teams/${this.teamId}/${dataType}`).set(data);
            } catch (error) {
                console.error(`Save error:`, error);
            }
        }
    }

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
            await this.database.ref(`teams/${this.teamId}/members`).set(this.members);
            await this.database.ref(`teams/${this.teamId}/attendance`).set(this.attendance);
            await this.database.ref(`teams/${this.teamId}/tasks`).set(this.tasks);
            await this.database.ref(`teams/${this.teamId}/assignedTasks`).set(this.assignedTasks);
            
            const ideasObj = {};
            this.ideas.forEach(idea => {
                ideasObj[idea.id] = idea;
            });
            await this.database.ref(`teams/${this.teamId}/ideas`).set(ideasObj);
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

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

    populateSelects() {
        const selects = ['attendanceMember', 'ideaMember', 'assignTaskMember', 'taskMemberSelect', 'individualMemberSelect'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
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
            }
        });
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T');
        const sessionDate = document.getElementById('sessionDate');
        if (sessionDate) sessionDate.value = today;
    }

    updateAllDisplays() {
        this.updateAttendanceDisplay();
        this.updateIdeasDisplay();
        this.updateOverviewStats();
    }

    updateAttendanceDisplay() {
        const membersList = document.getElementById('membersList');
        if (!membersList) return;

        const today = new Date().toISOString().split('T');
        const todayAttendance = this.attendance[today] || {};

        let presentCount = 0, absentCount = 0, notMarkedCount = 0;

        let html = '<div class="attendance-date-group">';
        html += '<div class="date-header"><span><i class="fas fa-calendar-day"></i> Today\'s Attendance</span></div>';
        html += '<div class="members-grid" style="padding: 24px;">';

        this.members.forEach(member => {
            const status = todayAttendance[member] || 'not-marked';
            if (status === 'present') presentCount++;
            else if (status === 'absent') absentCount++;
            else notMarkedCount++;

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
        
        const rate = this.members.length > 0 ? Math.round((presentCount / this.members.length) * 100) : 0;
        document.getElementById('attendanceRate').textContent = rate + '%';
    }

    updateIdeasDisplay() {
        const ideasBoard = document.getElementById('ideasBoard');
        if (!ideasBoard) return;

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

    updateOverviewStats() {
        const totalTasks = Object.values(this.tasks).reduce((total, memberTasks) => total + memberTasks.length, 0);
        const totalAssigned = Object.values(this.assignedTasks).reduce((total, memberTasks) => total + memberTasks.length, 0);
        const totalIdeas = this.ideas.length;
        const activeDays = Object.keys(this.attendance).length;

        let avgAttendance = 0;
        if (activeDays > 0) {
            const rates = Object.keys(this.attendance).map(date => {
                const dayAttendance = this.attendance[date];
                const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
                return (presentCount / this.members.length) * 100;
            });
            avgAttendance = Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
        }

        document.getElementById('totalTasks').textContent = totalTasks + totalAssigned;
        document.getElementById('totalIdeas').textContent = totalIdeas;
        document.getElementById('avgAttendance').textContent = avgAttendance + '%';
        document.getElementById('activeDays').textContent = activeDays;

        this.updatePerformanceSummary();
    }

    updatePerformanceSummary() {
        const performanceSummary = document.getElementById('performanceSummary');
        if (!performanceSummary) return;

        const memberStats = this.members.map(member => {
            const taskCount = this.tasks[member] ? this.tasks[member].length : 0;
            const ideaCount = this.ideas.filter(idea => idea.member === member).length;
            const assignedTasks = this.assignedTasks[member] || [];
            const completedAssigned = assignedTasks.filter(task => task.status === 'completed').length;
            
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
                assignedCompleted: completedAssigned,
                attendanceRate: Math.round(attendanceRate),
                totalScore: taskCount + ideaCount + (attendanceRate / 10) + completedAssigned * 2
            };
        });

        memberStats.sort((a, b) => b.totalScore - a.totalScore);

        const html = `
            <h3 style="margin-bottom: 24px;"><i class="fas fa-trophy"></i> Team Performance</h3>
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
                            <div style="text-align: center; padding: 12px; background: rgba(139, 69, 19, 0.1); border-radius: 8px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: #8b4513;">${member.assignedCompleted}</div>
                                <div style="font-size: 12px; color: var(--gray-600);">Assigned</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        performanceSummary.innerHTML = html;
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

    updateConnectionStatus(message, status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.innerHTML = message;
            statusElement.className = `connection-status ${status}`;
        }
    }

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

        this.members.push(memberName);
        await this.saveData('members', this.members);

        document.getElementById('newMemberName').value = '';
        this.showMessage(`✅ Member "${memberName}" added successfully!`, 'success');
        this.populateSelects();
        this.updateMembersList();
    }

    async removeMember(memberName) {
        if (confirm(`Remove "${memberName}"? This will delete all their data.`)) {
            this.members = this.members.filter(member => member !== memberName);
            delete this.tasks[memberName];
            delete this.assignedTasks[memberName];
            this.ideas = this.ideas.filter(idea => idea.member !== memberName);
            
            Object.keys(this.attendance).forEach(date => {
                delete this.attendance[date][memberName];
            });

            await this.saveData('members', this.members);
            this.showMessage(`✅ Member "${memberName}" removed successfully!`, 'success');
            this.populateSelects();
            this.updateMembersList();
            this.updateAllDisplays();
        }
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
    console.log('🌟 Starting Enhanced Team Management App with Category PDF Reports');
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded');
        return;
    }
    
    window.teamManager = new TeamManager();
});
