import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentQuizzes = ({ userEmail }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, incomplete: 0 });
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('list'); 
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); 
  const [scoreData, setScoreData] = useState(null);

  const fetchQuizzes = async () => {
    try {
      const activeEmail = (userEmail || "").toLowerCase().trim();
      if (!activeEmail) return;

      const stuRes = await axios.get('https://vinsup-4vt5.onrender.com/api/students').catch(() => null);
      const allStudents = stuRes?.data?.data || stuRes?.data || [];
      const currentStudent = allStudents.find(s => (s.email || '').toLowerCase().trim() === activeEmail);
      const studentBatch = currentStudent ? (currentStudent.batch || '').toLowerCase().trim() : '';

      const [quizRes, resultRes] = await Promise.all([
        axios.get('https://vinsup-4vt5.onrender.com/api/quizzes/all').catch(() => null),
        axios.get(`https://vinsup-4vt5.onrender.com/api/quizzes/results/${activeEmail}`).catch(() => null)
      ]);

      const allQuizzes = Array.isArray(quizRes?.data) ? quizRes.data : [];
      const myResults = Array.isArray(resultRes?.data) ? resultRes.data : [];

      const myQuizzes = allQuizzes.filter(q => {
         if (!q.batch) return true; 
         return q.batch.toLowerCase().trim() === studentBatch;
      });

      let completedCount = 0;
      let incompleteCount = 0;

      const formattedQuizzes = myQuizzes.map(q => {
          const studentResult = myResults.find(r => r.quizId === q._id);
          const isCompleted = !!studentResult;
          
          if (isCompleted) completedCount++;
          else incompleteCount++;

          // 🔥 FIXED: Pulling exact module name saved by trainer 🔥
          const modName = q.module || q.moduleName || q.subject || 'General Module';

          const createdDate = q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date';

          return {
              ...q,
              isCompleted: isCompleted,
              scoreAttained: studentResult ? studentResult.score : null,
              totalMarks: studentResult ? studentResult.totalMarks : (q.totalMarks || 0),
              displayDate: createdDate,
              displayModule: modName,
              displayQuestions: q.totalQuestions || (q.questions ? q.questions.length : 0)
          };
      });

      setQuizzes(formattedQuizzes);
      setStats({ total: formattedQuizzes.length, completed: completedCount, incomplete: incompleteCount });
      setLoading(false);

    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [userEmail]);

  const getModuleColor = (modName) => {
    const name = (modName || '').toLowerCase();
    if (name.includes('mongo')) return { bg: '#dcfce7', text: '#16a34a', iconBg: '#f0fdf4', iconColor: '#16a34a' }; 
    if (name.includes('express')) return { bg: '#f3e8ff', text: '#9333ea', iconBg: '#f5f3ff', iconColor: '#9333ea' }; 
    if (name.includes('react')) return { bg: '#eff6ff', text: '#2563eb', iconBg: '#f0f9ff', iconColor: '#2563eb' }; 
    if (name.includes('node')) return { bg: '#fef2f2', text: '#ef4444', iconBg: '#fff1f2', iconColor: '#ef4444' }; 
    if (name.includes('api')) return { bg: '#f3e8ff', text: '#9333ea', iconBg: '#f5f3ff', iconColor: '#9333ea' };
    if (name.includes('javascript') || name.includes('js')) return { bg: '#fef3c7', text: '#d97706', iconBg: '#fffbeb', iconColor: '#d97706' }; 
    return { bg: '#f1f5f9', text: '#64748b', iconBg: '#f8fafc', iconColor: '#64748b' };
  };

  const handleQuizClick = (quiz) => {
    if (quiz.isCompleted) {
       setScoreData({ score: quiz.scoreAttained, total: quiz.totalMarks });
       setView('result');
    } else if (quiz.questions && quiz.questions.length > 0) {
       setActiveQuiz(quiz);
       setView('intro');
       setAnswers({});
       setCurrentQIndex(0);
    } else {
       alert("This quiz doesn't have any questions yet.");
    }
  };

  const startQuiz = () => setView('quiz');
  const handleOptionSelect = (letter) => setAnswers({ ...answers, [currentQIndex]: letter });

  const nextQuestion = () => {
    if (currentQIndex < activeQuiz.questions.length - 1) setCurrentQIndex(currentQIndex + 1);
  };

  const prevQuestion = () => {
    if (currentQIndex > 0) setCurrentQIndex(currentQIndex - 1);
  };

  const submitQuiz = async () => {
    if(!window.confirm("Are you sure you want to submit the quiz?")) return;
    try {
      const res = await axios.post('https://vinsup-4vt5.onrender.com/api/quizzes/submit', {
        quizId: activeQuiz._id,
        studentEmail: userEmail,
        answers: answers
      });

      if (res.data.success) {
        setScoreData({ score: res.data.score, total: res.data.totalMarks });
        setView('result');
        fetchQuizzes(); 
      }
    } catch (err) {
      console.error("Error submitting quiz", err);
      alert("Failed to submit quiz.");
    }
  };

  const backToList = () => {
    setView('list');
    setActiveQuiz(null);
    setScoreData(null);
  };

  return (
    <div className="sq-main-wrapper">
      
      {view === 'list' && (
        <div className="sq-wrapper">
          <div className="sq-header">
            <h1 className="sq-title">Quizzes</h1>
            <div className="sq-breadcrumb">Home <i className="fas fa-chevron-right"></i> <span>Quizzes</span></div>
          </div>

          <div className="sq-stats-grid">
            <div className="sq-stat-card border-blue">
              <div className="stat-icon-box bg-blue"><i className="far fa-calendar-check text-blue"></i></div>
              <div><div className="stat-label">Total Quizzes</div><div className="stat-value">{stats.total}</div></div>
            </div>
            <div className="sq-stat-card border-green">
              <div className="stat-icon-box bg-green"><i className="far fa-check-circle text-green"></i></div>
              <div><div className="stat-label">Completed</div><div className="stat-value">{stats.completed}</div></div>
            </div>
            <div className="sq-stat-card border-orange">
              <div className="stat-icon-box bg-orange"><i className="far fa-times-circle text-orange"></i></div>
              <div><div className="stat-label">Incomplete</div><div className="stat-value">{stats.incomplete}</div></div>
            </div>
          </div>

          <div className="sq-main-card">
            <h3 className="card-title">All Quizzes</h3>
            <div className="table-responsive">
              <table className="sq-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Quiz Title</th>
                    <th style={{ textAlign: 'center' }}>Module</th>
                    <th style={{ textAlign: 'center' }}>Questions</th>
                    <th style={{ textAlign: 'center' }}>Created On</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="text-center" style={{padding: '40px', color: '#64748b'}}>Loading quizzes...</td></tr>
                  ) : quizzes.length > 0 ? (
                    quizzes.map((quiz, index) => {
                      const modStyle = getModuleColor(quiz.displayModule);
                      return (
                        <tr key={index} className="quiz-row" onClick={() => handleQuizClick(quiz)}>
                          <td>
                            <div className="quiz-title-cell">
                              <div className="quiz-icon" style={{ background: modStyle.iconBg, color: modStyle.iconColor }}>
                                <i className="far fa-file-alt"></i>
                              </div>
                              <div>
                                <h4 className="q-title">{quiz.title}</h4>
                                <p className="q-desc">{quiz.description || 'Test your knowledge on this topic.'}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="mod-badge" style={{ background: modStyle.bg, color: modStyle.text }}>{quiz.displayModule}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>{quiz.displayQuestions}</td>
                          <td style={{ textAlign: 'center', color: '#0f172a', fontWeight: '600', fontSize: '13px' }}>{quiz.displayDate}</td>
                          
                          <td style={{ textAlign: 'center', fontWeight: '700' }}>
                            {quiz.isCompleted ? (
                              <span style={{ color: '#16a34a' }}>{quiz.scoreAttained} / {quiz.totalMarks}</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <span className={`status-badge ${quiz.isCompleted ? 'status-completed' : 'status-incomplete'}`}>
                              {quiz.isCompleted ? 'Completed' : 'Incomplete'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center" style={{padding: '40px', color: '#64748b'}}>
                        <i className="fas fa-clipboard-list" style={{fontSize: '30px', color: '#cbd5e1', marginBottom: '10px', display: 'block'}}></i>
                        No quizzes allocated to your batch yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="sq-footer">© 2026 Vinsup Skill Academy. All rights reserved.</div>
        </div>
      )}

      {view === 'intro' && (
        <div className="quiz-action-container">
          <div className="quiz-intro-card">
             <div className="intro-icon"><i className="fas fa-laptop-code"></i></div>
             <h2>{activeQuiz.title}</h2>
             <p className="intro-desc">{activeQuiz.description || 'Get ready to test your knowledge. Make sure you have a stable internet connection.'}</p>
             
             <div className="intro-meta">
               <div className="meta-box">
                  <span>Total Questions</span>
                  <strong>{activeQuiz.questions.length}</strong>
               </div>
               <div className="meta-box">
                  <span>Total Marks</span>
                  <strong>{activeQuiz.totalMarks}</strong>
               </div>
             </div>

             <div className="intro-actions">
               <button className="btn-cancel" onClick={backToList}>Cancel</button>
               <button className="btn-start" onClick={startQuiz}>Start Quiz <i className="fas fa-arrow-right"></i></button>
             </div>
          </div>
        </div>
      )}

      {view === 'quiz' && (
        <div className="quiz-action-container">
          <div className="quiz-taking-card">
            
            <div className="qt-header">
              <div className="qt-title">
                <h3>{activeQuiz.title}</h3>
                <span>Question {currentQIndex + 1} of {activeQuiz.questions.length}</span>
              </div>
              <div className="qt-marks">Marks: {activeQuiz.questions[currentQIndex].marks}</div>
            </div>

            <div className="qt-progress-bg">
              <div className="qt-progress-fill" style={{ width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%` }}></div>
            </div>

            <div className="qt-body">
              <h2 className="qt-question-text">{currentQIndex + 1}. {activeQuiz.questions[currentQIndex].question}</h2>
              
              <div className="qt-options-list">
                {activeQuiz.questions[currentQIndex].options.map((opt, i) => {
                  const isSelected = answers[currentQIndex] === opt.letter;
                  return (
                    <div key={i} className={`qt-option ${isSelected ? 'selected' : ''}`} onClick={() => handleOptionSelect(opt.letter)}>
                      <div className="opt-letter">{opt.letter}</div>
                      <div className="opt-text">{opt.text}</div>
                      <div className="opt-radio">
                        {isSelected && <div className="opt-radio-inner"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="qt-footer">
              <button className="btn-outline" onClick={prevQuestion} disabled={currentQIndex === 0}>
                 <i className="fas fa-arrow-left"></i> Previous
              </button>

              {currentQIndex === activeQuiz.questions.length - 1 ? (
                <button className="btn-submit" onClick={submitQuiz} disabled={Object.keys(answers).length !== activeQuiz.questions.length}>
                  Submit Quiz <i className="fas fa-check"></i>
                </button>
              ) : (
                <button className="btn-next" onClick={nextQuestion}>
                  Next <i className="fas fa-arrow-right"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'result' && (
        <div className="quiz-action-container">
          <div className="quiz-result-card">
             <div className="result-icon" style={{ 
               color: (scoreData.score / scoreData.total) * 100 >= 80 ? "#16a34a" : (scoreData.score / scoreData.total) * 100 < 40 ? "#ef4444" : "#f59e0b", 
               background: `${(scoreData.score / scoreData.total) * 100 >= 80 ? "#16a34a" : (scoreData.score / scoreData.total) * 100 < 40 ? "#ef4444" : "#f59e0b"}20` 
             }}>
                <i className={(scoreData.score / scoreData.total) * 100 >= 80 ? "fas fa-trophy" : (scoreData.score / scoreData.total) * 100 < 40 ? "fas fa-book-reader" : "fas fa-thumbs-up"}></i>
             </div>
             <h2>{(scoreData.score / scoreData.total) * 100 >= 80 ? "Excellent Work!" : (scoreData.score / scoreData.total) * 100 < 40 ? "Keep Practicing!" : "Good effort!"}</h2>
             <p className="result-desc">You have successfully completed the assessment.</p>
             
             <div className="score-box">
               <div className="score-label">Your Score</div>
               <div className="score-value" style={{ color: (scoreData.score / scoreData.total) * 100 >= 80 ? "#16a34a" : (scoreData.score / scoreData.total) * 100 < 40 ? "#ef4444" : "#f59e0b" }}>
                 {scoreData.score} <span>/ {scoreData.total}</span>
               </div>
             </div>

             <button className="btn-primary-large" onClick={backToList}>
               <i className="fas fa-arrow-left"></i> Back to Dashboard
             </button>
          </div>
        </div>
      )}

      <style>{`
        .sq-main-wrapper { width: 100%; min-height: 100%; font-family: 'Inter', sans-serif; }
        .sq-wrapper { padding: 24px 32px; background: #f8fafc; min-height: 100vh; box-sizing: border-box; }
        .sq-header { margin-bottom: 24px; }
        .sq-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px;}
        .sq-breadcrumb { font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 8px;}
        .sq-breadcrumb i { font-size: 10px; }
        .sq-breadcrumb span { color: #0f172a; font-weight: 600; }

        .sq-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px; }
        .sq-stat-card { background: #fff; padding: 24px; border-radius: 12px; display: flex; align-items: center; gap: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .border-blue { border: 1px solid #e0e7ff; }
        .border-green { border: 1px solid #dcfce7; }
        .border-orange { border: 1px solid #ffedd5; }
        
        .stat-icon-box { width: 56px; height: 56px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24px; flex-shrink: 0;}
        .bg-blue { background: #eff6ff; }
        .text-blue { color: #2563eb; }
        .bg-green { background: #f0fdf4; }
        .text-green { color: #16a34a; }
        .bg-orange { background: #fff7ed; }
        .text-orange { color: #ea580c; }
        .stat-label { font-size: 13px; color: #0f172a; font-weight: 700; margin-bottom: 4px; }
        .stat-value { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }

        .sq-main-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 40px;}
        .card-title { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 20px 0; }

        .table-responsive { width: 100%; overflow-x: auto; }
        .sq-table { width: 100%; border-collapse: collapse; }
        .sq-table th { padding: 0 16px 16px 16px; color: #0f172a; font-weight: 800; font-size: 13px; border-bottom: 1px solid #f1f5f9; text-align: left;}
        .sq-table td { padding: 20px 16px; border-bottom: 1px dashed #f1f5f9; vertical-align: middle; }
        .quiz-row { cursor: pointer; transition: 0.2s; }
        .quiz-row:hover { background: #f8fafc; }

        .quiz-title-cell { display: flex; align-items: center; gap: 16px; }
        .quiz-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; justify-content: center; align-items: center; font-size: 18px; flex-shrink: 0;}
        .q-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
        .q-desc { font-size: 12px; color: #64748b; margin: 0; }

        .mod-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block;}
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block; }
        .status-completed { background: #dcfce7; color: #16a34a; }
        .status-incomplete { background: #fee2e2; color: #ef4444; }
        .text-center { text-align: center; }
        .sq-footer { text-align: center; font-size: 12px; color: #64748b; padding-bottom: 20px; font-weight: 500;}

        .quiz-action-container { display: flex; justify-content: center; align-items: flex-start; padding: 40px; min-height: 100vh; background: #f8fafc; }
        .quiz-intro-card, .quiz-result-card { background: #fff; width: 100%; max-width: 500px; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; border: 1px solid #e2e8f0; }

        .intro-icon, .result-icon { width: 80px; height: 80px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 32px; margin: 0 auto 20px auto; }
        .intro-icon { background: #eff6ff; color: #2563eb; }
        .quiz-intro-card h2, .quiz-result-card h2 { font-size: 24px; color: #0f172a; font-weight: 800; margin: 0 0 10px 0; }
        .intro-desc, .result-desc { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 30px; }

        .intro-meta { display: flex; justify-content: center; gap: 20px; margin-bottom: 30px; }
        .meta-box { background: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; flex: 1; }
        .meta-box span { display: block; font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 5px; }
        .meta-box strong { font-size: 20px; color: #0f172a; font-weight: 800; }

        .intro-actions { display: flex; gap: 15px; justify-content: center; }
        .btn-cancel { background: #fff; border: 1px solid #cbd5e1; padding: 12px 24px; border-radius: 8px; color: #475569; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-cancel:hover { background: #f1f5f9; }
        .btn-start { background: #2563eb; border: none; padding: 12px 24px; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-start:hover { background: #1d4ed8; }

        .quiz-taking-card { background: #fff; width: 100%; max-width: 700px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden; }
        .qt-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 30px; border-bottom: 1px solid #f1f5f9; }
        .qt-title h3 { margin: 0 0 5px 0; font-size: 16px; color: #0f172a; font-weight: 800; }
        .qt-title span { font-size: 13px; color: #64748b; font-weight: 600; }
        .qt-marks { background: #f1f5f9; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #475569; }

        .qt-progress-bg { height: 4px; background: #e2e8f0; width: 100%; }
        .qt-progress-fill { height: 100%; background: #2563eb; transition: width 0.3s ease; }

        .qt-body { padding: 30px; }
        .qt-question-text { font-size: 18px; color: #0f172a; font-weight: 700; line-height: 1.5; margin: 0 0 24px 0; }
        .qt-options-list { display: flex; flex-direction: column; gap: 12px; }
        .qt-option { display: flex; align-items: center; gap: 15px; padding: 16px 20px; border: 2px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: 0.2s; background: #fff; }
        .qt-option:hover { border-color: #cbd5e1; background: #f8fafc; }
        .qt-option.selected { border-color: #2563eb; background: #eff6ff; }
        .opt-letter { width: 30px; height: 30px; background: #f1f5f9; border-radius: 6px; display: flex; justify-content: center; align-items: center; font-weight: 800; color: #475569; font-size: 13px; flex-shrink: 0; }
        .qt-option.selected .opt-letter { background: #2563eb; color: #fff; }
        .opt-text { flex: 1; font-size: 15px; color: #1e293b; font-weight: 500; }
        .qt-option.selected .opt-text { color: #0f172a; font-weight: 700; }
        .opt-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #cbd5e1; display: flex; justify-content: center; align-items: center; }
        .qt-option.selected .opt-radio { border-color: #2563eb; }
        .opt-radio-inner { width: 10px; height: 10px; border-radius: 50%; background: #2563eb; }

        .qt-footer { padding: 20px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .btn-outline { background: #fff; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 8px; color: #475569; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline:hover:not(:disabled) { background: #f1f5f9; }
        .btn-next { background: #2563eb; border: none; padding: 10px 20px; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-next:hover { background: #1d4ed8; }
        .btn-submit { background: #16a34a; border: none; padding: 10px 24px; border-radius: 8px; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
        .btn-submit:hover:not(:disabled) { background: #15803d; }

        .score-box { background: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
        .score-label { font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .score-value { font-size: 48px; font-weight: 900; line-height: 1; }
        .score-value span { font-size: 24px; color: #94a3b8; font-weight: 700; }
        .btn-primary-large { background: #0f172a; border: none; padding: 14px 30px; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; transition: 0.2s; font-size: 15px;}
        .btn-primary-large:hover { background: #1e293b; }
      `}</style>
    </div>
  );
};

export default StudentQuizzes;