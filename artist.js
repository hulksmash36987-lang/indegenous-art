if (!protectPage(["artist"])) {
} else {
  const user = getUser()

  document.getElementById("logout-link").addEventListener("click", (e) => {
    e.preventDefault()
    logout()
  })

  function loadSubmissions() {
    fetchAPI(`artworks.php?action=my_submissions&user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const submissions = data.submissions || []

          document.getElementById("total-submissions").textContent = submissions.length
          document.getElementById("approved-count").textContent = submissions.filter((s) => s.status === "approved").length
          document.getElementById("pending-count").textContent = submissions.filter((s) => s.status === "pending").length

          const tbody = document.getElementById("submissions-table")
          tbody.innerHTML = ""

          if (submissions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No submissions yet</td></tr>'
            return
          }

          submissions.forEach((sub) => {
            const row = document.createElement("tr")
            row.innerHTML = `
              <td>${sub.title}</td>
              <td>${sub.type}</td>
              <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
              <td>${new Date(sub.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn-small btn-danger" onclick="deleteSubmission(${sub.id})">Delete</button>
              </td>
            `
            tbody.appendChild(row)
          })
        }
      })
      .catch((err) => {
        console.log("Error loading submissions:", err)
      })
  }

  window.deleteSubmission = function (id) {
    if (!confirm("Are you sure you want to delete this submission?")) {
      return
    }

    fetchAPI(`artworks.php?action=delete&id=${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Submission deleted")
          loadSubmissions()
        } else {
          alert("Failed to delete submission")
        }
      })
      .catch((err) => {
        console.log("Error deleting:", err)
        alert("Failed to delete submission")
      })
  }

  loadSubmissions()
}
