import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { courseApi, assessmentApi, Course } from '@/lib/api';

interface Question {
  id: string;
  type: 'mcq' | 'text';
  question: string;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  points: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  questions: Question[];
  timeLimit: number; // in minutes
  isPublished: boolean;
  resultsReleased?: boolean;
  attemptCount?: number;
  createdAt: string;
}

const AssessmentManagement: React.FC = () => {
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [publishingAssessmentId, setPublishingAssessmentId] = useState<string | null>(null);
  const [releasingResultsId, setReleasingResultsId] = useState<string | null>(null);

  // Form states
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  
  // Question form states
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'text'>('mcq');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [points, setPoints] = useState('');

  // Fetch courses and assessments on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch teacher's courses and assessments in parallel
      const [fetchedCourses, fetchedAssessments] = await Promise.all([
        courseApi.getMyTeachingCourses(),
        assessmentApi.getMyTeachingAssessments()
      ]);
      
      setCourses(fetchedCourses);

      // Transform API assessments to local format
      const assessmentsWithQuestions = await Promise.all(
        fetchedAssessments.map(async (assessment) => {
          const course = fetchedCourses.find(c => c.id === assessment.courseId);
          
          let questions: Question[] = [];
          let attemptCount = 0;
          try {
            const apiQuestions = await assessmentApi.getQuestions(assessment.id);
            questions = apiQuestions.map(q => ({
              id: q.id,
              type: q.type === 'MultipleChoice' ? 'mcq' as const : 'text' as const,
              question: q.text,
              options: q.options?.map(o => o.text) || [],
              correctAnswer: q.options?.find(o => o.isCorrect)?.text,
              modelAnswer: (q.type === 'ShortAnswer' || q.type === 'Essay') ? '' : undefined,
              points: q.points
            }));

            // Fetch attempts count
            const attempts = await assessmentApi.getAssessmentAttempts(assessment.id);
            attemptCount = attempts.length;
          } catch (error) {
            console.error(`Failed to fetch data for assessment ${assessment.id}:`, error);
          }

          return {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            courseId: assessment.courseId,
            courseName: course?.name || 'Unknown Course',
            timeLimit: assessment.durationMinutes,
            isPublished: assessment.isPublished,
            resultsReleased: assessment.resultsReleased || false,
            attemptCount,
            questions,
            createdAt: assessment.createdAt
          };
        })
      );
      
      setAssessments(assessmentsWithQuestions);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      
      if (error?.status === 401 || error?.response?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to load courses and assessments",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!assessmentTitle.trim() || !assessmentDescription.trim() || !selectedCourse || !timeLimit) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      const createdAssessment = await assessmentApi.create({
        courseId: selectedCourse,
        title: assessmentTitle,
        description: assessmentDescription,
        durationMinutes: parseInt(timeLimit)
      });
      
      const courseName = courses.find(c => c.id === selectedCourse)?.name || '';
      const newAssessment: Assessment = {
        id: createdAssessment.id,
        title: createdAssessment.title,
        description: createdAssessment.description,
        courseId: createdAssessment.courseId,
        courseName,
        timeLimit: createdAssessment.durationMinutes,
        isPublished: createdAssessment.isPublished,
        questions: [],
        createdAt: createdAssessment.createdAt
      };

      setAssessments([...assessments, newAssessment]);
      resetAssessmentForm();
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Assessment created successfully"
      });
    } catch (error) {
      console.error('Failed to create assessment:', error);
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !points || !currentAssessment) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    if (questionType === 'mcq') {
      const validOptions = options.filter(opt => opt.trim());
      if (validOptions.length < 2 || !correctAnswer) {
        toast({
          title: "Error",
          description: "MCQ questions need at least 2 options and a correct answer",
          variant: "destructive"
        });
        return;
      }
    }

    if (questionType === 'text' && !modelAnswer.trim()) {
      toast({
        title: "Error",
        description: "Text questions require a model answer",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      const questionData = {
        text: questionText,
        type: questionType === 'mcq' ? 'MultipleChoice' : 'ShortAnswer',
        points: parseInt(points),
        expectedAnswer: questionType === 'text' ? modelAnswer : undefined,
        options: questionType === 'mcq' 
          ? options.filter(opt => opt.trim()).map(opt => ({
              text: opt,
              isCorrect: opt === correctAnswer
            }))
          : []
      };

      const createdQuestion = await assessmentApi.addQuestion(currentAssessment.id, questionData);

      const newQuestion: Question = {
        id: createdQuestion.id,
        type: questionType,
        question: createdQuestion.text,
        ...(questionType === 'mcq' ? {
          options: createdQuestion.options?.map(o => o.text) || [],
          correctAnswer: createdQuestion.options?.find(o => o.isCorrect)?.text
        } : {
          modelAnswer
        }),
        points: createdQuestion.points
      };

      setAssessments(assessments.map(assessment => 
        assessment.id === currentAssessment.id
          ? { ...assessment, questions: [...assessment.questions, newQuestion] }
          : assessment
      ));

      resetQuestionForm();
      setIsQuestionDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Question added successfully"
      });
    } catch (error) {
      console.error('Failed to add question:', error);
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!questionText.trim() || !points || !currentAssessment || !editingQuestion) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    if (questionType === 'mcq') {
      const validOptions = options.filter(opt => opt.trim());
      if (validOptions.length < 2 || !correctAnswer) {
        toast({
          title: "Error",
          description: "MCQ questions need at least 2 options and a correct answer",
          variant: "destructive"
        });
        return;
      }
    }

    if (questionType === 'text' && !modelAnswer.trim()) {
      toast({
        title: "Error",
        description: "Text questions require a model answer",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      const questionData = {
        text: questionText,
        type: questionType === 'mcq' ? 'MultipleChoice' : 'ShortAnswer',
        points: parseInt(points),
        expectedAnswer: questionType === 'text' ? modelAnswer : undefined,
        options: questionType === 'mcq' 
          ? options.filter(opt => opt.trim()).map(opt => {
              return {
                text: opt,
                isCorrect: opt === correctAnswer
              };
            })
          : []
      };

      const updatedQuestion = await assessmentApi.updateQuestion(editingQuestion.id, questionData);

      const newQuestion: Question = {
        id: updatedQuestion.id,
        type: questionType,
        question: updatedQuestion.text,
        options: questionType === 'mcq' ? (updatedQuestion.options?.map(o => o.text) || []) : undefined,
        correctAnswer: questionType === 'mcq' ? updatedQuestion.options?.find(o => o.isCorrect)?.text : undefined,
        modelAnswer: questionType === 'text' ? modelAnswer : undefined,
        points: updatedQuestion.points
      };

      const updatedAssessments = assessments.map(assessment => {
        if (assessment.id === currentAssessment.id) {
          return {
            ...assessment,
            questions: assessment.questions.map(q => {
              if (q.id === editingQuestion.id) {
                return newQuestion;
              }
              return q;
            })
          };
        }
        return assessment;
      });
      setAssessments(updatedAssessments);

      resetQuestionForm();
      setEditingQuestion(null);
      setIsQuestionDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Question updated successfully"
      });
    } catch (error) {
      console.error('Failed to update question:', error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (assessmentId: string, questionId: string) => {
    try {
      setDeletingQuestionId(questionId);

      setAssessments(assessments.map(assessment => 
        assessment.id === assessmentId
          ? { ...assessment, questions: assessment.questions.filter(q => q.id !== questionId) }
          : assessment
      ));

      await assessmentApi.deleteQuestion(questionId);
      
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
    } catch (error) {
      console.error('Failed to delete question:', error);
      await fetchData();
      
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string, assessmentTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${assessmentTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAssessmentId(assessmentId);
      
      setAssessments(prevAssessments => prevAssessments.filter(a => a.id !== assessmentId));
      
      await assessmentApi.delete(assessmentId);
      
      toast({
        title: "Success",
        description: `Assessment "${assessmentTitle}" deleted successfully`
      });
    } catch (error) {
      console.error('Failed to delete assessment:', error);
      await fetchData();
      
      toast({
        title: "Error",
        description: "Failed to delete assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingAssessmentId(null);
    }
  };

  const handleTogglePublish = async (assessmentId: string, currentStatus: boolean) => {
    try {
      setPublishingAssessmentId(assessmentId);
      
      setAssessments(prevAssessments => 
        prevAssessments.map(a => 
          a.id === assessmentId 
            ? { ...a, isPublished: !currentStatus } 
            : a
        )
      );

      if (currentStatus) {
        await assessmentApi.unpublish(assessmentId);
        toast({
          title: "Success",
          description: "Assessment unpublished successfully"
        });
      } else {
        await assessmentApi.publish(assessmentId);
        toast({
          title: "Success",
          description: "Assessment published successfully"
        });
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      
      setAssessments(prevAssessments => 
        prevAssessments.map(a => 
          a.id === assessmentId 
            ? { ...a, isPublished: currentStatus } 
            : a
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to update assessment status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPublishingAssessmentId(null);
    }
  };

  const handleToggleResultsRelease = async (assessmentId: string, currentStatus: boolean) => {
    try {
      setReleasingResultsId(assessmentId);
      
      setAssessments(prevAssessments => 
        prevAssessments.map(a => 
          a.id === assessmentId 
            ? { ...a, resultsReleased: !currentStatus } 
            : a
        )
      );

      if (currentStatus) {
        await assessmentApi.withdrawResults(assessmentId);
        toast({
          title: "Success",
          description: "Results withdrawn"
        });
      } else {
        await assessmentApi.releaseResults(assessmentId);
        toast({
          title: "Success",
          description: "Results released!"
        });
      }
    } catch (error) {
      console.error('Failed to toggle results release:', error);
      
      setAssessments(prevAssessments => 
        prevAssessments.map(a => 
          a.id === assessmentId 
            ? { ...a, resultsReleased: currentStatus } 
            : a
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to update results release status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setReleasingResultsId(null);
    }
  };

  const resetAssessmentForm = () => {
    setAssessmentTitle('');
    setAssessmentDescription('');
    setSelectedCourse('');
    setTimeLimit('');
  };

  const resetQuestionForm = () => {
    setQuestionText('');
    setQuestionType('mcq');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setModelAnswer('');
    setPoints('');
    setEditingQuestion(null);
  };

  const openQuestionDialog = (assessment: Assessment) => {
    resetQuestionForm();
    setCurrentAssessment(assessment);
    setIsQuestionDialogOpen(true);
  };

  const openEditQuestionDialog = (assessment: Assessment, question: Question) => {
    setCurrentAssessment(assessment);
    setEditingQuestion(question);
    
    setQuestionText(question.question);
    setQuestionType(question.type);
    setPoints(question.points.toString());
    
    if (question.type === 'mcq') {
      const questionOptions = question.options || [];
      setOptions([
        questionOptions[0] || '',
        questionOptions[1] || '',
        questionOptions[2] || '',
        questionOptions[3] || ''
      ]);
      setCorrectAnswer(question.correctAnswer || '');
      setModelAnswer('');
    } else {
      setOptions(['', '', '', '']);
      setCorrectAnswer('');
      setModelAnswer(question.modelAnswer || '');
    }
    
    setIsQuestionDialogOpen(true);
  };

  const getTotalPoints = (assessment: Assessment) => {
    return assessment.questions.reduce((total, question) => total + question.points, 0);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading assessments...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Assessments</h1>
          <p style={{ color: '#718096', margin: '0', fontSize: '13px' }}>Create and manage assessments</p>
        </div>

        {/* Create Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            style={{
              padding: '8px 14px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            + New Assessment
          </button>
        </div>

        {/* Assessments List */}
        {assessments.length === 0 ? (
          <div style={{ padding: '20px 0', color: '#718096', fontSize: '13px', textAlign: 'center' }}>
            No assessments yet. Create one to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assessments.map((assessment) => (
              <div key={assessment.id} style={{ padding: '12px 0', borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setCurrentAssessment(assessment)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{assessment.title}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#718096' }}>{assessment.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTogglePublish(assessment.id, assessment.isPublished)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: assessment.isPublished ? '#10b981' : '#f3f4f6',
                        color: assessment.isPublished ? 'white' : '#718096',
                        border: '1px solid' + (assessment.isPublished ? ' #10b981' : ' #e2e8f0'),
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      {assessment.isPublished ? 'Published' : 'Draft'}
                    </button>
                    {assessment.isPublished && (assessment.attemptCount || 0) > 0 && (
                      <button
                        onClick={() => handleToggleResultsRelease(assessment.id, assessment.resultsReleased || false)}
                        disabled={releasingResultsId === assessment.id}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: assessment.resultsReleased ? '#ef4444' : '#fbbf24',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          opacity: releasingResultsId === assessment.id ? 0.6 : 1
                        }}
                      >
                        {releasingResultsId === assessment.id ? 'Updating...' : (assessment.resultsReleased ? 'Unpublish Results' : 'Publish Results')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id, assessment.title)}
                      disabled={deletingAssessmentId === assessment.id}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        opacity: deletingAssessmentId === assessment.id ? 0.6 : 1
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#718096', marginBottom: '8px' }}>
                  {assessment.courseName} • {assessment.questions.length} questions • {assessment.timeLimit}m
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openQuestionDialog(assessment);
                  }}
                  disabled={(assessment.attemptCount || 0) > 0}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (assessment.attemptCount || 0) > 0 ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    width: '100%',
                    opacity: (assessment.attemptCount || 0) > 0 ? 0.5 : 1
                  }}
                >
                  + Add Question
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Assessment Dialog */}
        {isCreateDialogOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                Create New Assessment
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Title</label>
                  <input
                    type="text"
                    value={assessmentTitle}
                    onChange={(e) => setAssessmentTitle(e.target.value)}
                    placeholder="Enter title"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Description</label>
                  <textarea
                    value={assessmentDescription}
                    onChange={(e) => setAssessmentDescription(e.target.value)}
                    placeholder="Enter description"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      minHeight: '60px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    placeholder="e.g. 60"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssessment}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    opacity: isSaving ? 0.6 : 1
                  }}
                >
                  {isSaving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Question Dialog */}
        {isQuestionDialogOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid #e2e8f0',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Question</label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter question"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      minHeight: '60px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#0f172a' }}>Type</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        value="mcq"
                        checked={questionType === 'mcq'}
                        onChange={(e) => setQuestionType(e.target.value as 'mcq' | 'text')}
                      />
                      <span style={{ fontSize: '13px', color: '#0f172a' }}>Multiple Choice</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        value="text"
                        checked={questionType === 'text'}
                        onChange={(e) => setQuestionType(e.target.value as 'mcq' | 'text')}
                      />
                      <span style={{ fontSize: '13px', color: '#0f172a' }}>Text Answer</span>
                    </label>
                  </div>
                </div>

                {questionType === 'mcq' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#0f172a' }}>Options</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {options.map((option, index) => (
                          <input
                            key={index}
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...options];
                              newOptions[index] = e.target.value;
                              setOptions(newOptions);
                            }}
                            placeholder={`Option ${index + 1}`}
                            style={{
                              padding: '8px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Correct Answer</label>
                      <select
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">Select correct answer</option>
                        {options.filter(opt => opt.trim()).map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {questionType === 'text' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Model Answer</label>
                    <textarea
                      value={modelAnswer}
                      onChange={(e) => setModelAnswer(e.target.value)}
                      placeholder="Enter model answer"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Points</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="e.g. 5"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setIsQuestionDialogOpen(false);
                    resetQuestionForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    opacity: isSaving ? 0.6 : 1
                  }}
                >
                  {isSaving ? 'Saving...' : editingQuestion ? 'Update' : 'Add'} Question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentManagement;
