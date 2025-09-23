import {createContext, ReactNode, useContext, useState} from "react";

export interface Notification {
    id: number;
    message: string;
    type: "success" | "error";
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (message: string, type: "success" | "error") => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used within NotificationProvider");
    return context;
};

export const NotificationProvider = ({children}: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (message: string, type: "success" | "error") => {
        const id = Date.now();
        setNotifications((prev) => [...prev, {id, message, type}]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3000); // auto-dismiss after 3s
    };

    return (
        <NotificationContext.Provider value={{notifications, addNotification}}>
            {children}
            {/* Notification container */}
            <div className="fixed top-4 right-4 space-y-2 z-50">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`px-4 py-2 rounded shadow-lg text-white ${
                            n.type === "success" ? "bg-green-500" : "bg-red-500"
                        }`}
                    >
                        {n.message}
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};