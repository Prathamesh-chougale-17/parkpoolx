"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import clientPromise from "@/db/clientpromise";

// Define types for our data
type ControlItem = {
  _id?: string;
  key: string;
  value: string;
  type: "general" | "parking-slot";
};

// Server actions for database operations
async function fetchControlItems() {
  try {
    const response = await fetch("/api/admin/control-items");
    if (!response.ok) throw new Error("Failed to fetch control items");
    return await response.json();
  } catch (error) {
    console.error("Error fetching control items:", error);
    return { generalItems: [], parkingSlots: [] };
  }
}

async function saveControlItem(item: Omit<ControlItem, "_id">) {
  try {
    const response = await fetch("/api/admin/control-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error("Failed to save control item");
    return await response.json();
  } catch (error) {
    console.error("Error saving control item:", error);
    return null;
  }
}

async function updateControlItem(item: ControlItem) {
  try {
    const response = await fetch(`/api/admin/control-items/${item._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error("Failed to update control item");
    return await response.json();
  } catch (error) {
    console.error("Error updating control item:", error);
    return null;
  }
}

export default function ControlPanel() {
  const [generalItems, setGeneralItems] = useState<ControlItem[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ControlItem[]>([]);
  const [editItem, setEditItem] = useState<ControlItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<ControlItem>>({
    key: "",
    value: "",
    type: "general",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchControlItems();
      setGeneralItems(data.generalItems || []);
      setParkingSlots(data.parkingSlots || []);
    };
    loadData();
  }, []);

  const handleAddNew = async () => {
    if (!newItem.key || !newItem.value || !newItem.type) {
      alert("Please fill all fields");
      return;
    }

    const result = await saveControlItem(newItem as Omit<ControlItem, "_id">);
    if (result) {
      if (newItem.type === "general") {
        setGeneralItems([...generalItems, result]);
      } else {
        setParkingSlots([...parkingSlots, result]);
      }
      setNewItem({ key: "", value: "", type: "general" });
      setIsAdding(false);
    }
  };

  const handleEdit = (item: ControlItem) => {
    setEditItem({ ...item });
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!editItem) return;

    const result = await updateControlItem(editItem);
    if (result) {
      if (editItem.type === "general") {
        setGeneralItems(
          generalItems.map((item) =>
            item._id === editItem._id ? result : item
          )
        );
      } else {
        setParkingSlots(
          parkingSlots.map((item) =>
            item._id === editItem._id ? result : item
          )
        );
      }
      setIsEditing(false);
      setEditItem(null);
    }
  };

  return (
    <div className="p-8 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">
        Admin Control Panel
      </h1>

      {/* General Settings Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white">
            General Settings
          </h2>
          <button
            onClick={() => {
              setNewItem({ key: "", value: "", type: "general" });
              setIsAdding(true);
            }}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            title="Add new setting"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-4 dark:bg-gray-800">
          {generalItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No general settings found.
            </p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {generalItems.map((item) => (
                  <tr key={item._id} className="dark:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
                      {item.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
                      {item.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Parking Slots Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white">
            Parking Slots
          </h2>
          <button
            onClick={() => {
              setNewItem({ key: "", value: "", type: "parking-slot" });
              setIsAdding(true);
            }}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            title="Add new parking slot"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-4 dark:bg-gray-800">
          {parkingSlots.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No parking slots found.
            </p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Slot Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {parkingSlots.map((slot) => (
                  <tr key={slot._id} className="dark:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
                      {slot.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
                      {slot.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(slot)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              Add New {newItem.type === "general" ? "Setting" : "Parking Slot"}
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                {newItem.type === "general" ? "Key" : "Slot Number"}
              </label>
              <input
                type="text"
                value={newItem.key}
                onChange={(e) =>
                  setNewItem({ ...newItem, key: e.target.value })
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                {newItem.type === "general" ? "Value" : "Location"}
              </label>
              <input
                type="text"
                value={newItem.value}
                onChange={(e) =>
                  setNewItem({ ...newItem, value: e.target.value })
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAdding(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNew}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditing && editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              Edit {editItem.type === "general" ? "Setting" : "Parking Slot"}
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                {editItem.type === "general" ? "Key" : "Slot Number"}
              </label>
              <input
                type="text"
                value={editItem.key}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                {editItem.type === "general" ? "Value" : "Location"}
              </label>
              <input
                type="text"
                value={editItem.value}
                onChange={(e) =>
                  setEditItem({ ...editItem, value: e.target.value })
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditItem(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-800"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
