import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  courseApi, 
  assessmentApi, 
  progressApi,
  Course,
  Assessment,
  Question,
  AssessmentAttempt,
  CreateCourseRequest,
  CreateAssessmentRequest,
  CreateQuestionRequest,
  SubmitAnswerRequest,
  EnrollmentWithDetails
} from '@/lib/api';

// ==================== QUERY KEYS ====================
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    myTeaching: ['courses', 'my-teaching'] as const,
    myEnrolled: ['courses', 'my-enrolled'] as const,
    detail: (id: string) => ['courses', id] as const,
    enrollments: (id: string) => ['courses', id, 'enrollments'] as const,
  },
  assessments: {
    byCourse: (courseId: string) => ['assessments', 'course', courseId] as const,
    detail: (id: string) => ['assessments', id] as const,
    questions: (id: string) => ['assessments', id, 'questions'] as const,
    available: ['assessments', 'available'] as const,
    attempt: (id: string) => ['assessments', 'attempts', id] as const,
    attemptAnswers: (id: string) => ['assessments', 'attempts', id, 'answers'] as const,
  },
  progress: {
    my: ['progress', 'my'] as const,
    myAttempts: ['progress', 'my-attempts'] as const,
    course: (courseId: string) => ['progress', 'course', courseId] as const,
  },
};

// ==================== COURSE HOOKS ====================

export const useAllCourses = () => {
  return useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: courseApi.getAll,
  });
};

export const useMyTeachingCourses = () => {
  return useQuery({
    queryKey: queryKeys.courses.myTeaching,
    queryFn: courseApi.getMyTeachingCourses,
  });
};

export const useMyEnrolledCourses = () => {
  return useQuery({
    queryKey: queryKeys.courses.myEnrolled,
    queryFn: courseApi.getMyEnrolledCourses,
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => courseApi.getById(id),
    enabled: !!id,
  });
};

export const useCourseEnrollments = (courseId: string) => {
  return useQuery({
    queryKey: queryKeys.courses.enrollments(courseId),
    queryFn: () => courseApi.getEnrollments(courseId),
    enabled: !!courseId,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCourseRequest) => courseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.myTeaching });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCourseRequest }) => 
      courseApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.myTeaching });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.id) });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => courseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.myTeaching });
    },
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (courseId: string) => courseApi.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.myEnrolled });
    },
  });
};

export const useUpdateCourseProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, progress }: { courseId: string; progress: number }) => 
      courseApi.updateProgress(courseId, progress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.myEnrolled });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.my });
    },
  });
};

// ==================== ASSESSMENT HOOKS ====================

export const useAssessmentsByCourse = (courseId: string) => {
  return useQuery({
    queryKey: queryKeys.assessments.byCourse(courseId),
    queryFn: () => assessmentApi.getAllByCourse(courseId),
    enabled: !!courseId,
  });
};

export const useAssessment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.assessments.detail(id),
    queryFn: () => assessmentApi.getById(id),
    enabled: !!id,
  });
};

export const useAssessmentQuestions = (assessmentId: string) => {
  return useQuery({
    queryKey: queryKeys.assessments.questions(assessmentId),
    queryFn: () => assessmentApi.getQuestions(assessmentId),
    enabled: !!assessmentId,
  });
};

export const useAvailableAssessments = () => {
  return useQuery({
    queryKey: queryKeys.assessments.available,
    queryFn: assessmentApi.getAvailableForStudent,
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAssessmentRequest) => assessmentApi.create(data),
    onSuccess: (newAssessment) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assessments.byCourse(newAssessment.courseId) 
      });
    },
  });
};

export const useUpdateAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateAssessmentRequest }) => 
      assessmentApi.update(id, data),
    onSuccess: (updatedAssessment) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assessments.byCourse(updatedAssessment.courseId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assessments.detail(updatedAssessment.id) 
      });
    },
  });
};

export const useDeleteAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => assessmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
};

export const usePublishAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => assessmentApi.publish(id),
    onSuccess: (updatedAssessment) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assessments.byCourse(updatedAssessment.courseId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assessments.detail(updatedAssessment.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assessments.available 
      });
    },
  });
};

export const useAddQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateQuestionRequest) => assessmentApi.addQuestion(data),
    onSuccess: (newQuestion) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assessments.questions(newQuestion.assessmentId) 
      });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (questionId: string) => assessmentApi.deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
};

export const useStartAttempt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assessmentId: string) => assessmentApi.startAttempt(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.myAttempts });
    },
  });
};

export const useSubmitAnswers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: string; answers: SubmitAnswerRequest[] }) => 
      assessmentApi.submitAnswers(attemptId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.myAttempts });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.my });
    },
  });
};

export const useAttempt = (attemptId: string) => {
  return useQuery({
    queryKey: queryKeys.assessments.attempt(attemptId),
    queryFn: () => assessmentApi.getAttempt(attemptId),
    enabled: !!attemptId,
  });
};

export const useAttemptAnswers = (attemptId: string) => {
  return useQuery({
    queryKey: queryKeys.assessments.attemptAnswers(attemptId),
    queryFn: () => assessmentApi.getAttemptAnswers(attemptId),
    enabled: !!attemptId,
  });
};

// ==================== PROGRESS HOOKS ====================

export const useMyProgress = () => {
  return useQuery({
    queryKey: queryKeys.progress.my,
    queryFn: progressApi.getMyProgress,
  });
};

export const useMyAttempts = () => {
  return useQuery({
    queryKey: queryKeys.progress.myAttempts,
    queryFn: progressApi.getMyAttempts,
  });
};

export const useCourseProgress = (courseId: string) => {
  return useQuery({
    queryKey: queryKeys.progress.course(courseId),
    queryFn: () => progressApi.getCourseProgress(courseId),
    enabled: !!courseId,
  });
};
