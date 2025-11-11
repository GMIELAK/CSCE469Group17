import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { VaultEntry } from "../types";

/**
 * Password Vault Dashboard
 * - Add, view, edit, delete password entries.
 * - Each entry has toggle visibility and inline edit mode.
 * 
 * TODO (for future LLMs):
 *   - Replace local state with fetchVault() / updateVault() / deleteVaultEntry() API calls.
 *   - Encrypt/decrypt passwords on the client side before sending to the backend.
 */

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<VaultEntry>>({});

  /** Adds a new password entry */
  const addEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site.trim()) return;
    const newEntry: VaultEntry = {
      id: crypto.randomUUID(),
      site,
      username,
      password,
    };
    setEntries((prev) => [...prev, newEntry]);
    setSite("");
    setUsername("");
    setPassword("");
  };

  /** Deletes an existing entry */
  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  /** Toggles password visibility for one entry */
  const toggleVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /** Begins inline editing */
  const startEditing = (entry: VaultEntry) => {
    setEditingId(entry.id);
    setEditValues({ site: entry.site, username: entry.username, password: entry.password });
  };

  /** Saves the inline edits */
  const saveEdit = (id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...editValues } : e
      )
    );
    setEditingId(null);
    setEditValues({});
  };

  /** Cancels edit mode */
  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  return (
    <div className="center-container">
      <div className="card">
        <div className="dashboard-header">
          <h2>Password Vault</h2>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>

        {/* Form to add new entries */}
        <form onSubmit={addEntry} className="vault-form">
          <input
            placeholder="Website"
            value={site}
            onChange={(e) => setSite(e.target.value)}
          />
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>

        {/* Table of vault entries */}
        <table className="vault-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Username</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No entries yet
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isEditing = editingId === entry.id;
                return (
                  <tr key={entry.id}>
                    <td>
                      {isEditing ? (
                        <input
                          value={editValues.site ?? ""}
                          onChange={(e) =>
                            setEditValues({ ...editValues, site: e.target.value })
                          }
                        />
                      ) : (
                        entry.site
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          value={editValues.username ?? ""}
                          onChange={(e) =>
                            setEditValues({ ...editValues, username: e.target.value })
                          }
                        />
                      ) : (
                        entry.username
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          value={editValues.password ?? ""}
                          onChange={(e) =>
                            setEditValues({ ...editValues, password: e.target.value })
                          }
                        />
                      ) : (
                        <span>
                          {visiblePasswords[entry.id]
                            ? entry.password
                            : "•".repeat(entry.password.length || 8)}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(entry.id)}
                            style={{ backgroundColor: "#22c55e", marginRight: "4px" }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            style={{ backgroundColor: "#9ca3af" }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleVisibility(entry.id)}
                          >
                            {visiblePasswords[entry.id] ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditing(entry)}
                            style={{ backgroundColor: "#f59e0b", marginLeft: "4px" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEntry(entry.id)}
                            style={{ backgroundColor: "#e11d48", marginLeft: "4px" }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
