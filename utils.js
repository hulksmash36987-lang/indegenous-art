const API_URL = "api"

function getToken() {
  return localStorage.getItem("token")
}

function getUser() {
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

function checkAuth() {
  return getToken() !== null
}

function logout() {
  const token = getToken()

  if (token) {
    fetch(`${API_URL}/auth.php?action=logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch((err) => console.log("Logout error:", err))
  }

  localStorage.removeItem("token")
  localStorage.removeItem("user")
  sessionStorage.clear()

  window.location.replace("login.html")
}

function protectPage(allowedRoles = []) {
  const user = getUser()
  const token = getToken()

  if (!token || !user) {
    window.location.replace("login.html")
    return false
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert("You don't have permission to access this page")
    window.location.replace("index.html")
    return false
  }

  return true
}

function updateAuthLinks() {
  const authLinksContainer = document.getElementById("auth-links")
  if (!authLinksContainer) return

  const user = getUser()
  if (user) {
    let profileLink = "artist.html"
    if (user.role === "admin") {
      profileLink = "admin.html"
    }

    authLinksContainer.innerHTML = `
      <a href="${profileLink}">Profile</a>
      <a href="#" id="logout-link">Logout</a>
    `

    const logoutLink = document.getElementById("logout-link")
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault()
        logout()
      })
    }
  } else {
    authLinksContainer.innerHTML = '<a href="login.html">Signin/Signup</a>'
  }
}

function makeArtCard(art) {
  const card = document.createElement("div")
  card.className = "art-card"
  card.onclick = () => (window.location.href = `detail.html?id=${art.id}`)

  card.innerHTML = `
    <div class="art-card-image-container">
      <img src="${art.image_url}" alt="${art.title}" class="art-card-image" />
    </div>
    <div class="art-card-text">
      <h3 class="font-semibold">${art.title}</h3>
      <p class="text-gray-600">${art.type}</p>
    </div>
  `
  return card
}

function fetchAPI(endpoint, options = {}) {
  const token = getToken()
  const defaultHeaders = {
    "Content-Type": "application/json",
  }

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  return fetch(`${API_URL}/${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })
}
