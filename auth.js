document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const googleSignInBtn = document.getElementById('google-signin-btn');
    const toggleAuthBtn = document.getElementById('toggle-auth-btn');
    const toggleText = document.getElementById('toggle-text');
    const authTitle = document.getElementById('auth-title');

    let isLogin = true;

    function toggleAuthMode() {
        isLogin = !isLogin;
        if (isLogin) {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            authTitle.textContent = 'Login';
            toggleText.textContent = 'Need an account?';
            toggleAuthBtn.textContent = 'Sign Up';
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            authTitle.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleAuthBtn.textContent = 'Login';
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        console.log("Login attempt with Firebase not implemented.");
        alert("Feature not implemented. This is where Firebase login would occur.");
    }

    function handleSignup(e) {
        e.preventDefault();
        console.log("Signup attempt with Firebase not implemented.");
        alert("Feature not implemented. This is where Firebase signup would occur.");
    }

    function handleGoogleSignIn() {
        console.log("Google Sign-In with Firebase not implemented.");
        alert("Feature not implemented. This is where Firebase Google Sign-In would occur.");
    }

    toggleAuthBtn.addEventListener('click', toggleAuthMode);
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    googleSignInBtn.addEventListener('click', handleGoogleSignIn);
});
