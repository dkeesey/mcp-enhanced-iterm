import { Session } from '../types/index.js';
export declare class SessionManager {
    private sessions;
    private nextSessionNumber;
    enumerateSessions(): Promise<Session[]>;
    private parseSessionList;
    private parseSessionData;
    private extractValue;
    createSession(name?: string, profile?: string): Promise<Session>;
    switchToSession(sessionId: string): Promise<void>;
    getSession(sessionId: string): Session | undefined;
    getAllSessions(): Session[];
    updateSessionState(sessionId: string, state: Session['state']): void;
    setSessionWorkingDirectory(sessionId: string, directory: string): Promise<void>;
    closeSession(sessionId: string): Promise<void>;
    closeAllSessions(): Promise<void>;
}
//# sourceMappingURL=SessionManager.d.ts.map