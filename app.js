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
    }).catch((err) => console.log("[v0] Logout error:", err))
  }

  localStorage.removeItem("token")
  localStorage.removeItem("user")

  // Clear session storage too
  sessionStorage.clear()

  // Redirect and prevent back button
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
    let dashboardLink = "artist.html"
    if (user.role === "admin") {
      dashboardLink = "admin.html"
    }

    authLinksContainer.innerHTML = `
      <a href="${dashboardLink}">Dashboard</a>
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

// HOME PAGE
if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
  updateAuthLinks()

  fetch(`${API_URL}/artworks.php?action=latest&limit=6`)
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("latest-artworks")
      if (!container) return

      container.innerHTML = ""

      if (data.success && data.artworks.length > 0) {
        data.artworks.forEach((art) => {
          container.appendChild(makeArtCard(art))
        })
      } else {
        container.innerHTML = '<div class="no-data-message">No artworks available yet.</div>'
      }
    })
    .catch((err) => {
      console.log("[v0] Error loading artworks:", err)
      const container = document.getElementById("latest-artworks")
      if (container) {
        container.innerHTML = '<div class="error-message">Failed to load artworks.</div>'
      }
    })
}

if (window.location.pathname.includes("login.html")) {
  // Redirect if already logged in
  if (checkAuth()) {
    const user = getUser()
    if (user.role === "admin") {
      window.location.replace("admin.html")
    } else if (user.role === "artist") {
      window.location.replace("artist.html")
    } else {
      window.location.replace("index.html")
    }
  }

  const form = document.getElementById("login-form")
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const errorDiv = document.getElementById("login-error")

    fetch(`${API_URL}/auth.php?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          localStorage.setItem("token", data.token)
          localStorage.setItem("user", JSON.stringify(data.user))

          if (data.user.role === "admin") {
            window.location.replace("admin.html")
          } else if (data.user.role === "artist") {
            window.location.replace("artist.html")
          } else {
            window.location.replace("index.html")
          }
        } else {
          errorDiv.textContent = data.message
          errorDiv.style.display = "block"
        }
      })
      .catch((err) => {
        console.log("[v0] Login error:", err)
        errorDiv.textContent = "Login failed. Please try again."
        errorDiv.style.display = "block"
      })
  })
}

if (window.location.pathname.includes("signup.html")) {
  // Redirect if already logged in
  if (checkAuth()) {
    window.location.replace("index.html")
  }

  const form = document.getElementById("signup-form")
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    const username = document.getElementById("username").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const confirm = document.getElementById("confirm_password").value
    const account_type = document.getElementById("account_type").value
    const errorDiv = document.getElementById("signup-error")

    if (password !== confirm) {
      errorDiv.textContent = "Passwords do not match"
      errorDiv.style.display = "block"
      return
    }

    if (password.length < 6) {
      errorDiv.textContent = "Password must be at least 6 characters"
      errorDiv.style.display = "block"
      return
    }

    fetch(`${API_URL}/auth.php?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, account_type }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Account created successfully! Please login.")
          window.location.href = "login.html"
        } else {
          errorDiv.textContent = data.message
          errorDiv.style.display = "block"
        }
      })
      .catch((err) => {
        console.log("[v0] Signup error:", err)
        errorDiv.textContent = "Signup failed. Please try again."
        errorDiv.style.display = "block"
      })
  })
}

// COLLECTION PAGE
if (window.location.pathname.includes("collection.html")) {
  updateAuthLinks()

  let currentPage = 1
  let searchTerm = ""
  let sortBy = "title_asc"
  let selectedTypes = []
  let selectedPeriods = []

  document.getElementById("type-filter").addEventListener("click", () => {
    const dropdown = document.getElementById("type-dropdown")
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none"
    document.getElementById("period-dropdown").style.display = "none"
  })

  document.getElementById("period-filter").addEventListener("click", () => {
    const dropdown = document.getElementById("period-dropdown")
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none"
    document.getElementById("type-dropdown").style.display = "none"
  })

  function loadArtworks() {
    const params = new URLSearchParams({
      action: "list",
      page: currentPage,
      search: searchTerm,
      sort: sortBy,
    })

    if (selectedTypes.length > 0) {
      params.append("type", selectedTypes.join(","))
    }
    if (selectedPeriods.length > 0) {
      params.append("period", selectedPeriods.join(","))
    }

    fetch(`${API_URL}/artworks.php?${params}`)
      .then((res) => res.json())
      .then((data) => {
        const container = document.getElementById("artworks-grid")
        container.innerHTML = ""

        if (data.success && data.artworks.length > 0) {
          data.artworks.forEach((art) => {
            container.appendChild(makeArtCard(art))
          })
        } else {
          container.innerHTML = '<div class="no-data-message">No artworks found.</div>'
        }
      })
      .catch((err) => {
        console.log("[v0] Error loading artworks:", err)
        document.getElementById("artworks-grid").innerHTML = '<div class="error-message">Failed to load artworks.</div>'
      })
  }

  loadArtworks()

  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value
    currentPage = 1
    loadArtworks()
  })

  document.getElementById("sort-by").addEventListener("change", (e) => {
    sortBy = e.target.value
    loadArtworks()
  })

  document.getElementById("apply-filter").addEventListener("click", () => {
    selectedTypes = []
    selectedPeriods = []

    document.querySelectorAll("#type-dropdown input:checked").forEach((cb) => {
      selectedTypes.push(cb.value)
    })

    document.querySelectorAll("#period-dropdown input:checked").forEach((cb) => {
      selectedPeriods.push(cb.value)
    })

    document.getElementById("type-dropdown").style.display = "none"
    document.getElementById("period-dropdown").style.display = "none"

    loadArtworks()
  })

  document.getElementById("clear-filter").addEventListener("click", () => {
    searchTerm = ""
    selectedTypes = []
    selectedPeriods = []
    document.getElementById("search-input").value = ""
    document.querySelectorAll("#type-dropdown input, #period-dropdown input").forEach((cb) => {
      cb.checked = false
    })
    loadArtworks()
  })

  const loadMoreBtn = document.getElementById("load-more")
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      currentPage++
      loadArtworks()
    })
  }
}

// DETAIL PAGE
if (window.location.pathname.includes("detail.html")) {
  updateAuthLinks()

  const params = new URLSearchParams(window.location.search)
  const artId = params.get("id")

  if (artId) {
    fetch(`${API_URL}/artworks.php?action=detail&id=${artId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const art = data.artwork
          document.getElementById("art-title").textContent = art.title
          document.getElementById("art-type").textContent = art.type
          document.getElementById("art-period").textContent = art.period
          document.getElementById("art-artist").textContent = art.artist_name
          document.getElementById("art-location").textContent = art.location_notes || art.location
          document.getElementById("art-description").textContent = art.description
          document.getElementById("art-condition").textContent = art.condition_note || "N/A"
          document.getElementById("art-image").src = art.image_url
          document.title = `${art.title} - Indigenous Art Atlas`
        }
      })
      .catch((err) => {
        console.log("[v0] Error loading artwork:", err)
      })

    fetch(`${API_URL}/artworks.php?action=similar&id=${artId}&limit=3`)
      .then((res) => res.json())
      .then((data) => {
        const container = document.getElementById("similar-artworks")
        if (!container) return

        container.innerHTML = ""

        if (data.success && data.artworks.length > 0) {
          data.artworks.forEach((art) => {
            container.appendChild(makeArtCard(art))
          })
        }
      })
      .catch((err) => {
        console.log("[v0] Error loading similar artworks:", err)
      })
  }
}

// SUBMIT PAGE
if (window.location.pathname.includes("submit.html")) {
  if (!protectPage(["artist"])) {
    // stop further code by not executing anything
  } else {
    updateAuthLinks()

    fetch(`${API_URL}/categories.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          const select = document.getElementById("type")
          data.categories.forEach((cat) => {
            const option = document.createElement("option")
            option.value = cat.name
            option.textContent = cat.name
            select.appendChild(option)
          })
        }
      })
      .catch((err) => {
        console.log("[v0] Error loading categories:", err)
      })

    const form = document.getElementById("submit-form")
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const user = getUser()

      const formData = {
        title: document.getElementById("title").value,
        type: document.getElementById("type").value,
        description: document.getElementById("description").value,
        artist_name: document.getElementById("artist").value,
        period: document.getElementById("period").value,
        location: document.getElementById("location").value,
        location_notes: document.getElementById("location_notes")?.value || "",
        image_url: document.getElementById("image").value,
        location_sensitive: document.getElementById("sensitivity").checked,
        condition_note: document.getElementById("condition")?.value || "",
        user_id: user.id,
      }

      fetch(`${API_URL}/artworks.php?action=submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("Artwork submitted successfully! It will be reviewed by an admin.")
            window.location.href = "artist.html"
          } else {
            document.getElementById("submit-error").textContent = data.message || data.error
            document.getElementById("submit-error").style.display = "block"
          }
        })
        .catch((err) => {
          console.log("[v0] Submit error:", err)
          document.getElementById("submit-error").textContent = "Submission failed. Please try again."
          document.getElementById("submit-error").style.display = "block"
        })
    })
  }
}

