export interface QueueCall {
  number: number;
  timestamp: number; // ms since epoch
}

export interface QueueSession {
  id: string;
  name: string;
  myNumber: number;
  joinedAt: number; // ms since epoch
  calls: QueueCall[];
  createdAt: number;
  done: boolean;
}

export type ViewName = 'sessions' | 'tracker' | 'about';

export interface AppState {
  sessions: QueueSession[];
  activeSessionId: string | null;
  use24Hour: boolean;
  onboardingDone: boolean;
  currentView: ViewName;
}
