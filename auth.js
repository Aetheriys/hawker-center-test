import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBFdesQ4M3xf1xeKMD_DZEu0x7ocHq_gl8",
    authDomain: "fed-asg-9a8bf.firebaseapp.com",
    projectId: "fed-asg-9a8bf",
    storageBucket: "fed-asg-9a8bf.firebasestorage.app",
    messagingSenderId: "285158855777",
    appId: "1:285158855777:web:6d75221aa3f461a0ef0620"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let selectedRole = null;

// --- UI FUNCTIONS ---
window.selectRole = (role) => {
    selectedRole = role;
    const body = document.body;
    const card = document.querySelector('.login-card');
    const loginTitle = document.getElementById('login-title');
    const emailInput = document.getElementById('email');
    const appTitle = document.getElementById('app-title');

    // Theme Switching
    if (role === 'vendor') {
        body.classList.remove('theme-customer');
        body.classList.add('theme-vendor');
        
        // Update Card Styles for Vendor
        card.classList.remove('bg-white');
        card.classList.add('bg-[#1f2937]', 'text-white', 'border', 'border-gray-700');
        appTitle.classList.remove('text-gray-800');
        appTitle.classList.add('text-white');
        
        // Pre-fill
        loginTitle.innerText = "Vendor Login";
        emailInput.value = "vendor@hawkercentre.com";
    } else {
        // Reset to default
        body.classList.remove('theme-vendor');
        body.classList.add('theme-customer');
        
        card.classList.add('bg-white');
        card.classList.remove('bg-[#1f2937]', 'text-white', 'border', 'border-gray-700');
        appTitle.classList.add('text-gray-800');
        appTitle.classList.remove('text-white');

        loginTitle.innerText = "Customer Login";
        emailInput.value = "customer@hawkercentre.com";
    }

    // View Switching
    document.getElementById('step-role').classList.add('hidden');
    document.getElementById('step-login').classList.remove('hidden');
};

window.resetRole = () => {
    document.body.classList.remove('theme-vendor');
    document.body.classList.add('theme-customer');
    
    // Reset Card Styles
    const card = document.querySelector('.login-card');
    card.classList.add('bg-white');
    card.classList.remove('bg-[#1f2937]', 'text-white', 'border', 'border-gray-700');
    
    const appTitle = document.getElementById('app-title');
    appTitle.classList.add('text-gray-800');
    appTitle.classList.remove('text-white');

    document.getElementById('step-role').classList.remove('hidden');
    document.getElementById('step-login').classList.add('hidden');
};

// --- LOGIN SUBMIT ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');

    try {
        btn.innerText = "Signing in...";
        btn.disabled = true;
        btn.classList.add('opacity-75');

        // FORCE ANONYMOUS SIGN IN (Guarantees success for demo)
        await signInAnonymously(auth);

        // Redirect based on selected Role
        if (selectedRole === 'vendor') {
            window.location.href = 'vendor.html'; // Goes to FILE 4
        } else {
            window.location.href = 'customer.html'; // Goes to FILE 6
        }

    } catch (error) {
        console.error(error);
        alert("Login Error: " + error.message);
        btn.innerText = "Sign In";
        btn.disabled = false;
        btn.classList.remove('opacity-75');
    }
});