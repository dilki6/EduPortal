// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// API Client with authentication
class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      const apiError: any = new Error(error.message || `HTTP ${response.status}`);
      apiError.status = response.status;
      apiError.response = { status: response.status };
      throw apiError;
    }

    // Handle 204 No Content responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return {} as T;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

// ==================== TYPE DEFINITIONS ====================

export enum UserRole {
  Student = 'student',
  Teacher = 'teacher'
}

export enum QuestionType {
  MultipleChoice = 0,
  TrueFalse = 1,
  ShortAnswer = 2,
  Essay = 3
}

export enum AttemptStatus {
  InProgress = 0,
  Completed = 1,
  Graded = 2
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  createdAt: string;
}

export interface CreateCourseRequest {
  name: string;
  description: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  progress: number;
  enrolledAt: string;
}

export interface EnrollmentWithDetails {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  progress: number;
  enrolledAt: string;
}

export interface EnrollStudentRequest {
  studentId: string;
  courseId: string;
}

export interface StudentDto {
  id: string;
  name: string;
  email: string;
  username: string;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  isPublished: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface CreateAssessmentRequest {
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  dueDate?: string;
}

export interface Question {
  id: string;
  assessmentId: string;
  text: string;
  type: string; // "MultipleChoice", "TrueFalse", "ShortAnswer", "Essay"
  points: number;
  order: number;
  expectedAnswer?: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface CreateQuestionRequest {
  text: string;
  type: string; // "MultipleChoice", "TrueFalse", "ShortAnswer", "Essay"
  points: number;
  expectedAnswer?: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  startedAt: string;
  completedAt?: string;
  score: number;
  maxScore: number;
  status: AttemptStatus;
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  questionText: string;
  questionType: string;
  questionPoints: number;
  questionOptions: QuestionOption[];
  selectedOptionId?: string;
  selectedOptionText?: string;
  textAnswer?: string;
  pointsEarned: number;
  isCorrect: boolean;
  correctOptionId?: string;
  correctAnswer?: string;
  expectedAnswer?: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  coursesEnrolled: number;
  completedAssessments: number;
  averageScore: number;
}

// ==================== API FUNCTIONS ====================

// Auth APIs
export const authApi = {
  login: (data: LoginRequest) => 
    apiClient.post<LoginResponse>('/auth/login', data),
  
  register: (data: RegisterRequest) => 
    apiClient.post<LoginResponse>('/auth/register', data),
  
  getMe: () => 
    apiClient.get<User>('/auth/me'),
};

// Course APIs
export const courseApi = {
  getAll: () => 
    apiClient.get<Course[]>('/courses'),
  
  getById: (id: string) => 
    apiClient.get<Course>(`/courses/${id}`),
  
  create: (data: CreateCourseRequest) => 
    apiClient.post<Course>('/courses', data),
  
  update: (id: string, data: CreateCourseRequest) => 
    apiClient.put<Course>(`/courses/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete<void>(`/courses/${id}`),
  
  getMyTeachingCourses: () => 
    apiClient.get<Course[]>('/courses/my-teaching'),
  
  getMyEnrolledCourses: () => 
    apiClient.get<Course[]>('/courses/my-enrolled'),
  
  enroll: (data: EnrollStudentRequest) => 
    apiClient.post<{ message: string }>('/courses/enroll', data),
  
  unenroll: (enrollmentId: string) => 
    apiClient.delete<void>(`/courses/enroll/${enrollmentId}`),
  
  updateProgress: (courseId: string, progress: number) => 
    apiClient.put<Enrollment>(`/courses/${courseId}/progress`, { progress }),
  
  getEnrollments: (courseId: string) => 
    apiClient.get<EnrollmentWithDetails[]>(`/courses/${courseId}/enrollments`),
  
  getAllStudents: () => 
    apiClient.get<StudentDto[]>('/courses/students/all'),
};

// Assessment APIs
export const assessmentApi = {
  getMyTeachingAssessments: () => 
    apiClient.get<Assessment[]>('/assessments/my-teaching'),
  
  getAllByCourse: (courseId: string) => 
    apiClient.get<Assessment[]>(`/assessments/course/${courseId}`),
  
  getById: (id: string) => 
    apiClient.get<Assessment>(`/assessments/${id}`),
  
  create: (data: CreateAssessmentRequest) => 
    apiClient.post<Assessment>('/assessments', data),
  
  update: (id: string, data: CreateAssessmentRequest) => 
    apiClient.put<Assessment>(`/assessments/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete<void>(`/assessments/${id}`),
  
  publish: (id: string) => 
    apiClient.put<Assessment>(`/assessments/${id}/publish`, {}),
  
  getQuestions: (assessmentId: string) => 
    apiClient.get<Question[]>(`/assessments/${assessmentId}/questions`),
  
  addQuestion: (assessmentId: string, data: CreateQuestionRequest) => 
    apiClient.post<Question>(`/assessments/${assessmentId}/questions`, data),
  
  deleteQuestion: (questionId: string) => 
    apiClient.delete<void>(`/assessments/questions/${questionId}`),
  
  getAvailableForStudent: () => 
    apiClient.get<Assessment[]>('/assessments/available'),
  
  startAttempt: (assessmentId: string) => 
    apiClient.post<AssessmentAttempt>(`/assessments/${assessmentId}/start`),
  
  submitAnswers: (attemptId: string, answers: SubmitAnswerRequest[]) => 
    apiClient.post<AssessmentAttempt>(`/assessments/attempts/${attemptId}/submit`, { answers }),
  
  getAttempt: (attemptId: string) => 
    apiClient.get<AssessmentAttempt>(`/assessments/attempts/${attemptId}`),
  
  getAttemptAnswers: (attemptId: string) => 
    apiClient.get<Answer[]>(`/assessments/attempts/${attemptId}/answers`),
};

// Progress APIs
export const progressApi = {
  getMyProgress: () => 
    apiClient.get<StudentProgress>('/progress/my'),
  
  getMyAttempts: () => 
    apiClient.get<AssessmentAttempt[]>('/progress/my-attempts'),
  
  getCourseProgress: (courseId: string) => 
    apiClient.get<StudentProgress[]>(`/progress/course/${courseId}`),
};

export default apiClient;
