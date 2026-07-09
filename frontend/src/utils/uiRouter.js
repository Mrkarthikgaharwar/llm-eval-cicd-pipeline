// Front-End Client Side Routing Engine Configuration

// 1. Check Function: LocalStorage aur Session keys verify karna
export const checkAuthSession = () => {
    // Supabase standard access token parsing mapping
    const token = localStorage.getItem('supabase_auth_token');
    
    // Agar token maujood hai, toh user authenticated hai
    return !!token;
};

// 2. Navigation Guard Router: Pages ke beech secure movement manage karna
export const handlePageRouting = () => {
    const isAuthenticated = checkAuthSession();
    const currentPath = window.location.pathname;

    // Rule A: Agar user login nahi hai aur Dashboard par jaane ki koshish kare
    if (!isAuthenticated && currentPath.includes('Dashboard.html')) {
        console.warn("Access Denied. Redirecting to login session...");
        window.location.href = '../authentication/Login.html';
        return;
    }

    // Rule B: Agar user pehle se logged-in hai aur Signup/Login page par dubara jaye
    if (isAuthenticated && (currentPath.includes('Login.html') || currentPath.includes('Signup.html'))) {
        console.log("Active session detected. Redirecting to panel...");
        window.location.href = '../dashboard/Dashboard.html';
        return;
    }
};

// 3. Clear Session Function: Log out execute karne ke liye
export const handleUserLogout = () => {
    localStorage.removeItem('supabase_auth_token');
    window.location.href = '../authentication/Login.html';
};

// Execute security script immediately on client window load initialization
window.addEventListener('DOMContentLoaded', handlePageRouting); 
