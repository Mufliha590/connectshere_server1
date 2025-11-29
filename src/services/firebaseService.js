const { db } = require('../config/firebase');
const { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, setDoc, doc, updateDoc, increment, getCountFromServer, getDoc } = require('firebase/firestore');

const saveMessage = async (userId, role, content) => {
    try {
        const messagesRef = collection(db, 'conversations', userId, 'messages');
        await addDoc(messagesRef, {
            role,
            content,
            timestamp: serverTimestamp()
        });

        // Update user interaction count
        await updateUserStats(userId);

    } catch (error) {
        console.error('Error saving message to Firebase:', error);
    }
};

const updateUserStats = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            lastActive: serverTimestamp(),
            interactionCount: increment(1)
        }, { merge: true });
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
};

const logTokenUsage = async (userId, inputTokens, outputTokens) => {
    try {
        const data = {
            userId,
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            timestamp: serverTimestamp()
        };
        const usageRef = collection(db, 'usage');
        await addDoc(usageRef, data);
    } catch (error) {
        console.error('Error logging token usage:', error);
    }
};

const getConversationHistory = async (userId, messageLimit = 10) => {
    try {
        const messagesRef = collection(db, 'conversations', userId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));

        const querySnapshot = await getDocs(q);
        const history = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                role: data.role,
                parts: [{ text: data.content }]
            });
        });

        return history.reverse(); // Return in chronological order
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        return [];
    }
};

const getDashboardStats = async () => {
    try {
        // Get total users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getCountFromServer(usersRef);
        const totalUsers = usersSnapshot.data().count;

        // Get total usage
        const usageRef = collection(db, 'usage');
        const usageSnapshot = await getDocs(usageRef);
        let totalTokens = 0;
        usageSnapshot.forEach(doc => {
            totalTokens += (doc.data().totalTokens || 0);
        });

        // Get recent users
        const recentUsersQuery = query(usersRef, orderBy('lastActive', 'desc'), limit(10));
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsers = [];
        recentUsersSnapshot.forEach(doc => {
            recentUsers.push({ id: doc.id, ...doc.data() });
        });

        return {
            totalUsers,
            totalTokens,
            recentUsers
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return { totalUsers: 0, totalTokens: 0, recentUsers: [] };
    }
};

const getAISettings = async () => {
    try {
        const docRef = doc(db, 'settings', 'ai_config');
        const docSnap = await getDocs(query(collection(db, 'settings'), where('__name__', '==', 'ai_config'))); // Workaround if getDoc fails or just use getDoc
        // actually getDoc is better
        const snapshot = await require('firebase/firestore').getDoc(docRef);

        if (snapshot.exists()) {
            return snapshot.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting AI settings:', error);
        return null;
    }
};

const updateAISettings = async (settings) => {
    try {
        const docRef = doc(db, 'settings', 'ai_config');
        await setDoc(docRef, settings, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating AI settings:', error);
        return false;
    }
};

const addFileContent = async (fileData) => {
    try {
        const docRef = doc(db, 'settings', 'ai_config');
        // Use arrayUnion to add the file object to the 'files' array
        const { arrayUnion } = require('firebase/firestore');
        await updateDoc(docRef, {
            files: arrayUnion(fileData)
        });
        return true;
    } catch (error) {
        console.error('Error adding file content:', error);
        return false;
    }
};

const removeFileContent = async (fileId) => {
    try {
        const docRef = doc(db, 'settings', 'ai_config');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            const data = snapshot.data();
            const files = data.files || [];
            const updatedFiles = files.filter(f => f.id !== fileId);

            await updateDoc(docRef, {
                files: updatedFiles
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error removing file content:', error);
        return false;
    }
};

module.exports = {
    saveMessage,
    getConversationHistory,
    updateUserStats,
    logTokenUsage,
    getDashboardStats,
    getAISettings,
    updateAISettings,
    addFileContent,
    removeFileContent
};
