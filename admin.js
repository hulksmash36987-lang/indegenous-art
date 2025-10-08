if (!protectPage(["admin"])) {
} else {
  const user = getUser()
  document.getElementById("admin-username").textContent = user.username

  fetchAPI(`admin.php?action=stats`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("pending-count").textContent = data.stats.pending
        document.getElementById("users-count").textContent = data.stats.users
        document.getElementById("artworks-count").textContent = data.stats.artworks
      }
    })
    .catch((err) => console.log("Error loading stats:", err))

  fetchAPI(`admin.php?action=pending`)
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("pending-submissions")
      container.innerHTML = ""

      if (data.success && data.submissions.length > 0) {
        data.submissions.forEach((sub) => {
          const item = document.createElement("div")
          item.className = "admin-table-item"
          item.innerHTML = `
            <img src="${sub.image_url || "https://picsum.photos/seed/" + sub.id + "/100/100"}" class="item-thumbnail" />
            <div class="item-info">
              <h4 style="margin:0; font-weight:600;">${sub.title}</h4>
              <p style="margin:0; color:var(--color-gray-600); font-size:0.875rem;">${sub.type} - ${sub.artist_name}</p>
            </div>
            <div class="item-actions">
              <button class="btn btn-primary btn-sm" onclick="approveSubmission(${sub.id})">Approve</button>
              <button class="btn btn-secondary btn-sm" onclick="rejectSubmission(${sub.id})">Reject</button>
            </div>
          `
          container.appendChild(item)
        })
      } else {
        container.innerHTML = '<div class="no-data-message">No pending submissions.</div>'
      }
    })
    .catch((err) => {
      console.log("Error loading submissions:", err)
      document.getElementById("pending-submissions").innerHTML = '<div class="error-message">Failed to load submissions.</div>'
    })

  fetchAPI(`admin.php?action=users`)
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("users-list")
      container.innerHTML = ""

      if (data.success && data.users.length > 0) {
        data.users.forEach((usr) => {
          const item = document.createElement("div")
          item.className = "admin-table-item"
          item.innerHTML = `
            <div class="item-avatar"></div>
            <div class="item-info">
              <h4 style="margin:0; font-weight:600;">${usr.username}</h4>
              <p style="margin:0; color:var(--color-gray-600); font-size:0.875rem;">${usr.email}</p>
            </div>
            <div class="w-40">
              <select class="user-role-select" onchange="updateUserRole(${usr.id}, this.value)">
                <option value="general" ${usr.role === "general" ? "selected" : ""}>General</option>
                <option value="researcher" ${usr.role === "researcher" ? "selected" : ""}>Researcher</option>
                <option value="community_elder" ${usr.role === "community_elder" ? "selected" : ""}>Community Elder</option>
                <option value="artist" ${usr.role === "artist" ? "selected" : ""}>Artist</option>
                <option value="admin" ${usr.role === "admin" ? "selected" : ""}>Admin</option>
              </select>
            </div>
          `
          container.appendChild(item)
        })
      } else {
        container.innerHTML = '<div class="no-data-message">No users found.</div>'
      }
    })
    .catch((err) => {
      console.log("Error loading users:", err)
      document.getElementById("users-list").innerHTML = '<div class="error-message">Failed to load users.</div>'
    })

  fetchAPI(`categories.php?action=list`)
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("categories-list")
      container.innerHTML = ""

      if (data.success && data.categories.length > 0) {
        data.categories.forEach((cat) => {
          const item = document.createElement("div")
          item.className = "admin-table-item"
          item.innerHTML = `
            <div class="item-info">
              <h4 style="margin:0; font-weight:600;">${cat.name}</h4>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="deleteCategory(${cat.id})">Delete</button>
          `
          container.appendChild(item)
        })
      } else {
        container.innerHTML = '<div class="no-data-message">No categories found.</div>'
      }
    })
    .catch((err) => {
      console.log("Error loading categories:", err)
      document.getElementById("categories-list").innerHTML = '<div class="error-message">Failed to load categories.</div>'
    })
}

function approveSubmission(id) {
  fetchAPI(`admin.php?action=approve&id=${id}`, { method: "POST" })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Submission approved!")
        location.reload()
      } else {
        alert("Failed to approve submission")
      }
    })
    .catch((err) => console.log("Error approving:", err))
}

function rejectSubmission(id) {
  fetchAPI(`admin.php?action=reject&id=${id}`, { method: "POST" })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Submission rejected")
        location.reload()
      } else {
        alert("Failed to reject submission")
      }
    })
    .catch((err) => console.log("Error rejecting:", err))
}

function updateUserRole(userId, newRole) {
  fetchAPI(`admin.php?action=update_role`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role: newRole }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("User role updated!")
      } else {
        alert("Failed to update role")
      }
    })
    .catch((err) => console.log("Error updating role:", err))
}

function deleteCategory(id) {
  if (confirm("Are you sure you want to delete this category?")) {
    fetchAPI(`categories.php?action=delete&id=${id}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Category deleted")
          location.reload()
        } else {
          alert("Failed to delete category")
        }
      })
      .catch((err) => console.log("Error deleting category:", err))
  }
}

document.getElementById("add-category").addEventListener("click", () => {
  const name = prompt("Enter new category name:")
  if (name) {
    fetchAPI(`categories.php?action=add`, {
      method: "POST",
      body: JSON.stringify({ name }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Category added!")
          location.reload()
        } else {
          alert("Failed to add category")
        }
      })
      .catch((err) => console.log("Error adding category:", err))
  }
})
