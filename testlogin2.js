// Cache DOM elements for better performance
const PAGES = ["LoginPage", "AccountsPage", "AccountLoginPage", "HomePage", "DisguisePage"];
const PAGE_ELEMENTS = PAGES.reduce((acc, id) => {
    acc[id] = document.getElementById(id);
    return acc;
}, {});

const INPUT_ELEMENTS = {
    username: document.getElementById("username"),
    password: document.getElementById("password"),
    accountUsername: document.getElementById("accountUsername"),
    accountPassword: document.getElementById("accountPassword"),
    messageBox: document.getElementById("MessageBox"),
    messageBox2: document.getElementById("MessageBox2")
};

// Primary login credentials
const correctUsername = "Admin";
const correctPassword = "Celebrations00";

// Account credentials
const accountCredentials = {
    account1: { username: "Castor", password: "Lightbringer" },
    account2: { username: "Dracula", password: "CrimsonVampire" },
    account3: { username: "Spartacus Claudio", password: "Morningstar2000" },
    account4: { username: "Alyssa", password: "Valentinean" },
};

const LoginTimeout = 20 * 60 * 1000; // 20 minutes
let selectedAccount = null;

function changeText(isSuccessful) {
    const message = isSuccessful ? "LOGIN SUCCESSFUL" : "LOGIN UNSUCCESSFUL";
    
    // Determine which message box to use
    if (PAGE_ELEMENTS.AccountLoginPage.style.display === "block") {
        INPUT_ELEMENTS.messageBox2.textContent = message;
    } else {
        INPUT_ELEMENTS.messageBox.textContent = message;
    }
}

function clearInputFields() {
    INPUT_ELEMENTS.username.value = "";
    INPUT_ELEMENTS.password.value = "";
    INPUT_ELEMENTS.accountUsername.value = "";
    INPUT_ELEMENTS.accountPassword.value = "";
    INPUT_ELEMENTS.messageBox.textContent = "";
    INPUT_ELEMENTS.messageBox2.textContent = "";
}

function setLastPage(pageId) {
    localStorage.setItem("LastPage", pageId);
    if (["AccountsPage", "AccountLoginPage"].includes(pageId)) {
        localStorage.setItem("AccountsLoginTime", new Date().getTime());
    }
}

function showPage(pageId) {
    // Hide all pages efficiently
    PAGES.forEach(id => {
        PAGE_ELEMENTS[id].style.display = "none";
    });

    PAGE_ELEMENTS[pageId].style.display = "block";

    // Set background color based on page
    if (["LoginPage", "AccountsPage", "AccountLoginPage"].includes(pageId)) {
        document.body.style.backgroundColor = "white";
    } else {
        document.body.style.backgroundColor = "black";
    }

    setLastPage(pageId);
    clearInputFields();
}

function checkLoginStatus() {
    const currentTime = new Date().getTime();
    const accountsLoginTime = localStorage.getItem("AccountsLoginTime");
    const lastPage = localStorage.getItem("LastPage");

    // Always persist HomePage and DisguisePage regardless of timeout
    if (lastPage === "HomePage") {
        showPage("HomePage");
    } else if (lastPage === "DisguisePage") {
        showPage("DisguisePage");
    } else if (
        ["AccountsPage", "AccountLoginPage"].includes(lastPage) &&
        accountsLoginTime &&
        currentTime - parseInt(accountsLoginTime) < LoginTimeout
    ) {
        showPage(lastPage);
    } else {
        showPage("LoginPage");
    }
}

// Set up event listeners once
document.addEventListener("DOMContentLoaded", function() {
    // Main login button
    document.getElementById("signinBtn").addEventListener("click", function() {
        const username = INPUT_ELEMENTS.username.value;
        const password = INPUT_ELEMENTS.password.value;

        if (username === correctUsername && password === correctPassword) {
            showPage("AccountsPage");
            changeText(true);
        } else {
            changeText(false);
        }
    });

    // Account login button
    document.getElementById("accountSigninBtn").addEventListener("click", function() {
        const username = INPUT_ELEMENTS.accountUsername.value;
        const password = INPUT_ELEMENTS.accountPassword.value;

        if (
            selectedAccount &&
            username === accountCredentials[selectedAccount].username &&
            password === accountCredentials[selectedAccount].password
        ) {
            changeText(true);
            localStorage.setItem("AccountsLoginTime", new Date().getTime());

            if (selectedAccount === "account3") {
                showPage("HomePage");
            } else if (selectedAccount === "account4") {
                showPage("DisguisePage");
            } else {
                showPage("AccountsPage");
            }
        } else {
            changeText(false);
        }
    });

    // FIXED: Account buttons event handling
    document.querySelectorAll(".accountBtn").forEach(button => {
        button.addEventListener("click", function() {
            selectedAccount = this.dataset.account;
            showPage("AccountLoginPage");
        });
    });

    // Navigation buttons
    const NAV_ELEMENTS = [
        { id: "title", page: "AccountsPage" },
        { id: "title2", page: "AccountsPage" },
        { id: "accountsLogin-title", page: "AccountsPage" },
        { id: "accounts-title", page: "LoginPage" }
    ];
    
    NAV_ELEMENTS.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.addEventListener("click", function() {
                if (item.id === "accounts-title") {
                    localStorage.removeItem("AccountsLoginTime");
                }
                showPage(item.page);
            });
        }
    });

    // Initial page load
    checkLoginStatus();
});