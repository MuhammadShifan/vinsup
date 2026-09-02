import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeQuizzes = ({ userName, userEmail }) => {
  const [activeTab, setActiveTab] = useState('all'); 
  const [quizzesList, setQuizzesList] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [quizResults, setQuizResults] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("");
  const [moduleName, setModuleName] = useState(""); 
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [totalMarks, setTotalMarks] = useState(1);
  const [description, setDescription] = useState("");
  
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      question: "",
      marks: 1,
      options: [
        { letter: "A", text: "" }, { letter: "B", text: "" },
        { letter: "C", text: "" }, { letter: "D", text: "" }
      ],
      correct: "A"
    }
  ]);

  const [viewingQuiz, setViewingQuiz] = useState(null);
  const activeEmail = (userEmail || "").toLowerCase().trim();

  useEffect(() => {
    fetchData();
  }, [userEmail]);

  const fetchData = async () => {
    try {
      const bRes = await axios.get('https://vinsup-4vt5.onrender.com/api/batches');
      const allB = Array.isArray(bRes.data) ? bRes.data : (bRes.data.data || []);
      const trainerBatches = allB.filter(b => {
        const trainerStr = (b.trainer || b.trainerName || b.assignedTo || b.faculty || '').toLowerCase().trim();
        return trainerStr === (userName || "").toLowerCase().trim() || trainerStr === activeEmail;
      });
      setMyBatches(trainerBatches);
      if (trainerBatches.length > 0 && !batch && activeTab === 'create') {
        setBatch(trainerBatches[0].batchName || trainerBatches[0].courseName);
      }

      try {
        const sylRes = await axios.get('https://vinsup-4vt5.onrender.com/api/syllabus');
        const sylData = Array.isArray(sylRes.data) ? sylRes.data : (sylRes.data.data || []);
        let extractedMods = [];
        sylData.forEach(s => {
          if (s.modules && Array.isArray(s.modules)) {
            s.modules.forEach(m => extractedMods.push(m.moduleName || m.title || m.name));
          } else if (s.moduleName) {
            extractedMods.push(s.moduleName);
          }
        });
        if (extractedMods.length === 0) {
          extractedMods = ['JavaScript', 'React.js', 'Node.js', 'Express.js', 'MongoDB', 'HTML', 'CSS', 'API'];
        }
        const uniqueMods = [...new Set(extractedMods)];
        setAvailableModules(uniqueMods);
        if (!moduleName && uniqueMods.length > 0) setModuleName(uniqueMods[0]);
      } catch (e) {
        const fallbackMods = ['JavaScript', 'React.js', 'Node.js', 'Express.js', 'MongoDB', 'HTML', 'CSS', 'API'];
        setAvailableModules(fallbackMods);
        if (!moduleName) setModuleName(fallbackMods[0]);
      }

      const stuRes = await axios.get('https://vinsup-4vt5.onrender.com/api/students').catch(()=>null);
      setAllStudents(stuRes?.data?.data || stuRes?.data || []);

      if (activeEmail) {
        const qRes = await axios.get(`https://vinsup-4vt5.onrender.com/api/quizzes/${activeEmail}`);
        setQuizzesList(Array.isArray(qRes.data) ? qRes.data : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(), question: "", marks: 1,
        options: [{ letter: "A", text: "" }, { letter: "B", text: "" }, { letter: "C", text: "" }, { letter: "D", text: "" }],
        correct: "A"
      }
    ]);
  };

  const handleRemoveQuestion = (id) => {
    if (questions.length === 1) return alert("You need at least one question!");
    const updatedQs = questions.filter(q => q.id !== id);
    setQuestions(updatedQs);
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleOptionChange = (qId, letter, value) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = q.options.map(opt => opt.letter === letter ? { ...opt, text: value } : opt);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setBatch(""); setCurrentQuizId(null);
    setQuestions([{ id: Date.now(), question: "", marks: 1, options: [{ letter: "A", text: "" }, { letter: "B", text: "" }, { letter: "C", text: "" }, { letter: "D", text: "" }], correct: "A" }]);
    if (myBatches.length > 0) setBatch(myBatches[0].batchName || myBatches[0].courseName);
    if (availableModules.length > 0) setModuleName(availableModules[0]);
    setTotalQuestions(1);
    setTotalMarks(1);
  };

  const handleSaveQuiz = async () => {
    if (!title.trim() || !batch || !moduleName) return alert("Please fill the Quiz Title, Batch, and select a Module.");
    
    for (let i = 0; i < questions.length; i++) {
        if(!questions[i].question.trim()) return alert(`Please enter the question text for Question ${i + 1}`);
    }

    // 🔥 FIXED: Explicitly mapping both module and moduleName 🔥
    const payload = { 
      title, 
      batch, 
      module: moduleName, 
      moduleName: moduleName, 
      totalQuestions, 
      totalMarks, 
      description, 
      trainerEmail: activeEmail, 
      questions 
    };

    try {
      if (activeTab === 'edit' && currentQuizId) {
        await axios.put(`https://vinsup-4vt5.onrender.com/api/quizzes/${currentQuizId}`, payload);
        alert("Quiz Updated Successfully! 🎉");
      } else {
        await axios.post('https://vinsup-4vt5.onrender.com/api/quizzes', payload);
        alert("Quiz Created Successfully! 🎉");
      }
      
      resetForm();
      fetchData(); 
      setActiveTab('all'); 
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Is backend running?");
    }
  };

  const handleEditQuiz = (quiz) => {
    setTitle(quiz.title);
    setBatch(quiz.batch);
    setModuleName(quiz.module || quiz.moduleName || availableModules[0] || 'General');
    setTotalQuestions(quiz.totalQuestions);
    setTotalMarks(quiz.totalMarks);
    setDescription(quiz.description || "");
    setQuestions(quiz.questions || []);
    setCurrentQuizId(quiz._id);
    setActiveTab('edit');
  };

  const handleViewQuiz = async (quiz) => {
    setViewingQuiz(quiz);
    setActiveTab('view');
    try {
      const res = await axios.get(`https://vinsup-4vt5.onrender.com/api/quizzes/${quiz._id}/results`);
      setQuizResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching quiz results:", err);
      setQuizResults([]);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await axios.delete(`https://vinsup-4vt5.onrender.com/api/quizzes/${id}`);
      fetchData(); 
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  const getPhotoUrl = (rawPath) => {
    if (!rawPath) return '';
    if (rawPath.startsWith('http') || rawPath.startsWith('data:image')) return rawPath;
    let cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    return `https://vinsup-4vt5.onrender.com/${cleanPath}`;
  };
  const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Student')}&background=f1f5f9&color=64748b`;

  let allocatedStudents = [];
  if (viewingQuiz) {
    const qBatch = String(viewingQuiz.batch || "").trim().toLowerCase();
    allocatedStudents = allStudents.filter(s => String(s.batch || "").trim().toLowerCase() === qBatch || s.batchId === viewingQuiz.batch);
  }

  const processedQuizzes = quizzesList.filter(quiz => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const qTitle = (quiz.title || "").toLowerCase();
    const qBatch = (quiz.batch || "").toLowerCase();
    return qTitle.includes(lowerQuery) || qBatch.includes(lowerQuery);
  });

  return (
    <div className="quiz-wrapper">
      
      {activeTab === 'all' ? (
        <>
          <div className="quiz-header-container">
            <div>
              <h1 className="quiz-page-title">Quizzes</h1>
              <p className="quiz-page-subtitle">Create and manage quizzes for your students.</p>
            </div>
          </div>

          <div className="quiz-tabs-header-row">
            <div className="quiz-tabs">
              <button className={`quiz-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => {resetForm(); setActiveTab('all');}}>All Quizzes</button>
            </div>
            <button className="quiz-create-btn" onClick={() => {
              resetForm(); 
              if(availableModules.length > 0) setModuleName(availableModules[0]);
              setActiveTab('create');
            }}><i className="fas fa-plus"></i> Create Quiz</button>
          </div>

          <div className="quiz-stats-grid">
            <div className="quiz-stat-card">
              <div className="quiz-stat-icon" style={{background: '#eff6ff', color: '#2563eb'}}><i className="fas fa-th"></i></div>
              <div className="quiz-stat-info">
                <span className="quiz-stat-label">Total Quizzes</span>
                <div className="quiz-stat-val-row"><span className="quiz-stat-number">{quizzesList.length}</span><span className="quiz-stat-desc">All time</span></div>
              </div>
            </div>
            <div className="quiz-stat-card">
              <div className="quiz-stat-icon" style={{background: '#fdf4ff', color: '#a855f7'}}><i className="fas fa-clipboard-check"></i></div>
              <div className="quiz-stat-info">
                <span className="quiz-stat-label">Completed</span>
                <div className="quiz-stat-val-row"><span className="quiz-stat-number">0</span><span className="quiz-stat-desc">Finished</span></div>
              </div>
            </div>
          </div>

          <div className="quiz-search-container">
            <div className="quiz-search-box">
              <input 
                type="text" 
                placeholder="Search quizzes by title or batch..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="fas fa-search"></i>
            </div>
          </div>

          <div className="quiz-table-container custom-scroll">
            <table className="quiz-table">
              <thead>
                <tr>
                  <th width="30%">Quiz Title</th>
                  <th width="20%">Batch</th>
                  <th width="15%">Module</th>
                  <th width="10%">Questions</th>
                  <th width="10%">Marks</th>
                  <th width="15%" style={{textAlign: 'right'}}></th>
                </tr>
              </thead>
              <tbody>
                {processedQuizzes.length > 0 ? processedQuizzes.map((quiz) => (
                  <tr key={quiz._id}>
                    <td>
                      <div className="q-title-box">
                        <span className="q-title">{quiz.title}</span>
                        <span className="q-desc">{quiz.description || "No description"}</span>
                      </div>
                    </td>
                    <td><span className="q-batch-badge blue">{quiz.batch}</span></td>
                    <td><span className="q-batch-badge purple" style={{background: '#f3e8ff', color: '#9333ea'}}>{quiz.module || quiz.moduleName || 'General'}</span></td>
                    <td className="q-bold-text">{quiz.totalQuestions}</td>
                    <td className="q-bold-text">{quiz.totalMarks}</td>
                    <td>
                      <div className="q-actions">
                        <button className="q-action-btn view" title="View Students" onClick={() => handleViewQuiz(quiz)}><i className="far fa-eye"></i></button>
                        <button className="q-action-btn edit" title="Edit Quiz" onClick={() => handleEditQuiz(quiz)}><i className="far fa-edit"></i></button>
                        <button className="q-action-btn delete" title="Delete Quiz" onClick={() => handleDeleteQuiz(quiz._id)}><i className="far fa-trash-alt"></i></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#94a3b8'}}>No Quizzes found matching your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>

        </>
      ) : activeTab === 'view' && viewingQuiz ? (
        <div className="cq-view">
          <div className="cq-header-row">
            <div>
              <h1 className="quiz-page-title">{viewingQuiz.title} - Students</h1>
              <p className="quiz-page-subtitle">Batch: <strong style={{color:'#0f172a'}}>{viewingQuiz.batch}</strong> • Module: {viewingQuiz.module || viewingQuiz.moduleName || 'General'} • Total Marks: {viewingQuiz.totalMarks}</p>
            </div>
            <button className="cq-back-btn" onClick={() => setActiveTab('all')}>
              <i className="fas fa-arrow-left"></i> Back to Quizzes
            </button>
          </div>

          <div className="quiz-table-container custom-scroll">
            <table className="quiz-table">
              <thead>
                <tr>
                  <th width="5%">#</th>
                  <th width="30%">Student Name</th>
                  <th width="25%">Email</th>
                  <th width="20%">Score</th>
                  <th width="20%">Quiz Status</th>
                </tr>
              </thead>
              <tbody>
                {allocatedStudents.length > 0 ? allocatedStudents.map((stu, index) => {
                  const result = quizResults.find(r => r.studentEmail === stu.email);
                  return (
                  <tr key={stu._id || index}>
                    <td className="fw-bold">{index + 1}</td>
                    <td>
                      <div className="cls-td-user">
                        <img src={getPhotoUrl(stu.profilePhoto) || fallbackAvatar(stu.fullName)} alt="avatar" />
                        <span className="fw-semibold">{stu.fullName}</span>
                      </div>
                    </td>
                    <td className="text-muted">{stu.email}</td>
                    <td style={{ fontWeight: '700' }}>
                      {result ? (
                        <span style={{ color: '#16a34a' }}>{result.score} / {result.totalMarks}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>
                      {result ? (
                        <span className="badge-pending" style={{background: '#dcfce7', color: '#16a34a'}}>Completed</span>
                      ) : (
                        <span className="badge-pending">Not Attempted</span>
                      )}
                    </td>
                  </tr>
                )}) : (
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px', color: '#94a3b8'}}>No students found in this batch.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      ) : (
        <div className="cq-view">
          <div className="cq-header-row">
            <div>
              <h1 className="quiz-page-title">{activeTab === 'edit' ? 'Edit Quiz' : 'Create Quiz'}</h1>
              <p className="quiz-page-subtitle">{activeTab === 'edit' ? 'Update your quiz details and questions.' : 'Add quiz details, questions, select module and assign to a batch.'}</p>
            </div>
            <button className="cq-back-btn" onClick={() => {resetForm(); setActiveTab('all');}}>
              <i className="fas fa-arrow-left"></i> Back to Quizzes
            </button>
          </div>

          <div className="cq-card">
            <h2 className="cq-card-title">Quiz Details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '15px' }}>
              <div className="cq-input-group">
                <label>Quiz Title <span className="req">*</span></label>
                <input type="text" className="cq-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. JS Basics Quiz" />
              </div>
              <div className="cq-input-group">
                <label>Batch <span className="req">*</span></label>
                <select className="cq-input cq-select" value={batch} onChange={e => setBatch(e.target.value)}>
                  <option value="">-- Select Batch --</option>
                  {myBatches.map((b, i) => (
                    <option key={i} value={b.batchName || b.courseName}>{b.batchName || b.courseName}</option>
                  ))}
                </select>
              </div>
              <div className="cq-input-group">
                <label>Module <span className="req">*</span></label>
                <select className="cq-input cq-select" value={moduleName} onChange={e => setModuleName(e.target.value)}>
                  <option value="">-- Select Module --</option>
                  {availableModules.map((mod, i) => (
                    <option key={i} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>
              <div className="cq-input-group">
                <label>Total Questions <span className="req">*</span></label>
                <input type="number" className="cq-input" value={totalQuestions} onChange={e => setTotalQuestions(e.target.value)} />
              </div>
              <div className="cq-input-group">
                <label>Total Marks <span className="req">*</span></label>
                <input type="number" className="cq-input" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} />
              </div>
            </div>

            <div className="cq-input-group mt-3">
              <label>Description (Optional)</label>
              <textarea className="cq-input" rows="2" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter a short description about the quiz..."></textarea>
            </div>
          </div>

          <div className="cq-qheader-row">
            <h2 className="cq-card-title" style={{margin: 0}}>Questions</h2>
            <button className="cq-add-q-btn" onClick={handleAddQuestion}>
              <i className="fas fa-plus"></i> Add Question
            </button>
          </div>

          <div className="cq-questions-list">
            {questions.map((q, idx) => (
              <div className="cq-q-card" key={q.id}>
                
                <div className="cq-q-top">
                  <div className="cq-q-num">{idx + 1}</div>
                  <div className="cq-input-group" style={{flex: 1, margin: 0}}>
                    <label>Question <span className="req">*</span></label>
                    <input type="text" className="cq-input" value={q.question} onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)} placeholder="Enter your question here..." />
                  </div>
                  <div className="cq-input-group" style={{width: '120px', margin: 0}}>
                    <label>Marks <span className="req">*</span></label>
                    <input type="number" className="cq-input" value={q.marks} onChange={(e) => handleQuestionChange(q.id, 'marks', e.target.value)} />
                  </div>
                  <div style={{display: 'flex', alignItems: 'flex-end'}}>
                    <button className="cq-del-btn" onClick={() => handleRemoveQuestion(q.id)}><i className="far fa-trash-alt"></i> Delete</button>
                  </div>
                </div>

                <div className="cq-opt-grid">
                  {q.options.map((opt, oIdx) => (
                    <div className="cq-opt-row" key={oIdx}>
                      <div className="cq-opt-circle">{opt.letter}</div>
                      <input type="text" className="cq-input" value={opt.text} onChange={(e) => handleOptionChange(q.id, opt.letter, e.target.value)} placeholder={`Option ${opt.letter}`} />
                      <input 
                        type="radio" 
                        name={`correct-${q.id}`} 
                        className="cq-radio" 
                        checked={opt.letter === q.correct}
                        onChange={() => handleQuestionChange(q.id, 'correct', opt.letter)}
                      />
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>

          <div className="cq-footer">
            <button className="cq-cancel-btn" onClick={() => {resetForm(); setActiveTab('all');}}>Cancel</button>
            <button className="cq-save-btn" onClick={handleSaveQuiz}>{activeTab === 'edit' ? 'Update Quiz' : 'Save Quiz'}</button>
          </div>

        </div>
      )}

      <style>{`
        .quiz-wrapper { padding: 32px 40px; font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; box-sizing: border-box; color: #0f172a; }
        .quiz-header-container { margin-bottom: 24px; }
        .quiz-page-title { font-size: 24px; font-weight: 800; color: #020617; margin: 0 0 6px 0; letter-spacing: -0.5px; }
        .quiz-page-subtitle { font-size: 14px; color: #475569; margin: 0; }

        .quiz-tabs-header-row { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #e2e8f0; margin-bottom: 30px; padding-bottom: 0px; }
        .quiz-tabs { display: flex; gap: 32px; }
        .quiz-tab-btn { background: transparent; border: none; font-size: 14px; font-weight: 600; color: #64748b; padding: 0 0 12px 0; cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; transform: translateY(1px); }
        .quiz-tab-btn:hover { color: #0f172a; }
        .quiz-tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

        .quiz-create-btn { background: #2563eb; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; margin-bottom: 12px; }
        .quiz-create-btn:hover { background: #1d4ed8; }

        .quiz-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 32px; }
        .quiz-stat-card { background: #ffffff; padding: 20px 24px; border-radius: 12px; border: 1px solid #f1f5f9; display: flex; gap: 16px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .quiz-stat-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 20px; flex-shrink: 0; }
        .quiz-stat-info { display: flex; flex-direction: column; }
        .quiz-stat-label { font-size: 13px; color: #475569; font-weight: 700; margin-bottom: 4px; }
        .quiz-stat-val-row { display: flex; flex-direction: column; }
        .quiz-stat-number { font-size: 26px; font-weight: 800; color: #020617; line-height: 1.1; }
        .quiz-stat-desc { font-size: 12px; color: #64748b; margin-top: 4px; }

        .quiz-search-container { margin-bottom: 20px; }
        .quiz-search-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; width: 340px; display: flex; align-items: center; justify-content: space-between; background: #ffffff; }
        .quiz-search-box input { border: none; outline: none; font-size: 13px; color: #0f172a; width: 100%; font-family: inherit; }
        .quiz-search-box input::placeholder { color: #94a3b8; }
        .quiz-search-box i { color: #94a3b8; font-size: 14px; }

        .quiz-table-container { border-radius: 12px; border: 1px solid #f1f5f9; overflow: hidden; background: #ffffff; max-height: 500px; overflow-y: auto;}
        .quiz-table { width: 100%; border-collapse: collapse; text-align: left; }
        .quiz-table th { background: #f8fafc; padding: 16px 24px; font-size: 12px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; z-index: 10;}
        .quiz-table td { padding: 16px 24px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
        .quiz-table tr:last-child td { border-bottom: none; }
        
        .q-title-box { display: flex; flex-direction: column; gap: 4px; }
        .q-title { font-size: 14px; font-weight: 700; color: #020617; }
        .q-desc { font-size: 12px; color: #64748b; }
        
        .q-batch-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
        .q-batch-badge.blue { background: #eff6ff; color: #2563eb; }
        
        .q-bold-text { font-size: 13px; font-weight: 700; color: #0f172a; }

        .q-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .q-action-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; }
        .q-action-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .q-action-btn.view i { color: #64748b; font-size: 13px; }
        .q-action-btn.edit i { color: #2563eb; font-size: 13px; }
        .q-action-btn.delete i { color: #ef4444; font-size: 13px; }

        .cq-view { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        .cq-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .cq-back-btn { background: #ffffff; border: 1px solid #cbd5e1; color: #2563eb; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .cq-back-btn:hover { background: #f1f5f9; }

        .cq-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .cq-card-title { font-size: 16px; font-weight: 800; color: #020617; margin: 0 0 20px 0; }
        
        .cq-input-group label { display: block; font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .req { color: #ef4444; }
        .cq-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 13px; font-family: inherit; color: #0f172a; outline: none; transition: 0.2s; box-sizing: border-box; }
        .cq-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px #eff6ff; }
        .cq-select { appearance: none; background: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 14px center; background-size: 14px; padding-right: 32px; }
        .mt-3 { margin-top: 20px; }

        .cq-qheader-row { display: flex; justifyContent: space-between; align-items: center; margin-bottom: 16px; }
        .cq-add-q-btn { background: #ffffff; border: 1px solid #cbd5e1; color: #2563eb; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .cq-add-q-btn:hover { background: #f8fafc; border-color: #94a3b8; }

        .cq-questions-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px; }
        .cq-q-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        
        .cq-q-top { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px; }
        .cq-q-num { width: 34px; height: 34px; border-radius: 50%; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; justify-content: center; align-items: center; font-size: 14px; font-weight: 800; color: #0f172a; flex-shrink: 0; margin-bottom: 3px;}
        .cq-del-btn { background: #fef2f2; border: 1px solid #fca5a5; color: #ef4444; padding: 10px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; height: 42px; }
        .cq-del-btn:hover { background: #fee2e2; }

        .cq-opt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding-left: 50px; }
        .cq-opt-row { display: flex; align-items: center; gap: 12px; }
        .cq-opt-circle { width: 28px; height: 28px; border-radius: 50%; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; justify-content: center; align-items: center; font-size: 12px; font-weight: 700; color: #475569; flex-shrink: 0; }
        .cq-radio { width: 18px; height: 18px; accent-color: #2563eb; cursor: pointer; margin: 0; }

        .cq-footer { display: flex; justifyContent: flex-end; gap: 12px; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 10px; }
        .cq-cancel-btn { background: #ffffff; border: 1px solid #cbd5e1; color: #475569; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .cq-cancel-btn:hover { background: #f8fafc; color: #0f172a; }
        .cq-save-btn { background: #2563eb; border: none; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .cq-save-btn:hover { background: #1d4ed8; }
        
        .fw-bold { font-weight: 700; }
        .fw-semibold { font-weight: 600; }
        .text-muted { color: #64748b; }
        .cls-td-user { display: flex; align-items: center; gap: 12px; }
        .cls-td-user img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
        .badge-pending { background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        
        .quiz-pagination-container { display: flex; justifyContent: space-between; align-items: center; margin-top: 24px; }
        .q-page-text { font-size: 13px; color: #64748b; }
        .q-pagination { display: flex; gap: 6px; }
        .q-page-btn { width: 32px; height: 32px; display: flex; justifyContent: center; align-items: center; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: 0.2s; }
        .q-page-btn:hover { background: #f8fafc; }
        .q-page-btn.active { background: #2563eb; border-color: #2563eb; color: #ffffff; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default EmployeeQuizzes;