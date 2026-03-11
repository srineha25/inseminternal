import React, { useState, useEffect } from "react";
import { CustomerAccount } from "./types";

export default function App() {
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState("Active");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  // Edit states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      setError("Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          date: newDate,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setNewName("");
        setNewDesc("");
        fetchCustomers();
      }
    } catch (err) {
      setError("Failed to insert.");
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          status: editStatus,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchCustomers();
      }
    } catch (err) {
      setError("Failed to update.");
    }
  };

  return (
    <div>
      <h1>Customer Account Manager</h1>
      <hr />

      <h2>I. Insert New Record</h2>
      <form onSubmit={handleInsert}>
        <div>
          Name: <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        </div>
        <div>
          Description: <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
        </div>
        <div>
          Date: <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
        </div>
        <div>
          Status: 
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <button type="submit">Add Account</button>
      </form>

      <hr />

      <h2>II. Records List & Update</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border={1}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>
                  {editingId === c.id ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    c.name
                  )}
                </td>
                <td>{c.description}</td>
                <td>{c.date}</td>
                <td>
                  {editingId === c.id ? (
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  ) : (
                    c.status
                  )}
                </td>
                <td>
                  {editingId === c.id ? (
                    <>
                      <button onClick={() => handleUpdate(c.id!)}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => {
                      setEditingId(c.id!);
                      setEditName(c.name);
                      setEditStatus(c.status);
                    }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
