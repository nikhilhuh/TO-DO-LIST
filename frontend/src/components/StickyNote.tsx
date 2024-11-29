import React, { useEffect, useState } from "react";
import { IoAddCircle } from "react-icons/io5";
import { AiFillPushpin } from "react-icons/ai";
import { RiUnpinFill } from "react-icons/ri";
import { ImCross } from "react-icons/im";

type Note = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
};

interface StickyNotesProps {
  Height?: string | number;
  Width?: string | number;
}

const StickyNotes: React.FC<StickyNotesProps> = ({ Height, Width }) => {
  const [notes, setNotes] = useState<Note[]>([
    { id: Date.now(), title: "", content: "", pinned: false },
  ]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: "",
      content: "",
      pinned: false,
    };
    setNotes((prevNotes) => {
      const updatedNotes = [...prevNotes, newNote];
      localStorage.setItem("sticky-notes", JSON.stringify(updatedNotes));
      return updatedNotes;
    });
  };

  const updateNote = (id: number, field: keyof Note, value: string) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((note) =>
        note.id === id ? { ...note, [field]: value } : note
      );
      localStorage.setItem("sticky-notes", JSON.stringify(updatedNotes)); 
      return updatedNotes;
    });
  };

  const deleteNote = (id: number) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.filter((note) => note.id !== id);
      localStorage.setItem("sticky-notes", JSON.stringify(updatedNotes)); 
      return updatedNotes;
    });
  };

  const togglePin = (id: number) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned } : note
      );
  
      // Sort the notes before saving to localStorage
      const sortedNotes = updatedNotes.sort(
        (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
      );
  
      // Save the sorted notes to localStorage
      localStorage.setItem("sticky-notes", JSON.stringify(sortedNotes));
  
      return sortedNotes; // Update state with sorted notes
    });
  };
  

  useEffect(() => {
    const savedNotes = localStorage.getItem("sticky-notes");
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        if (Array.isArray(parsedNotes) && parsedNotes.length>0) {
          setNotes(parsedNotes);
        }
      } catch (error) {
        console.error("Error parsing notes from localStorage:", error);
        localStorage.removeItem("sticky-notes");
      }
    }
  }, []);

  return (
    <div
      className={`p-4 w-full overflow-x-hidden overflow-y-auto`}
      style={{
        maxHeight: Height || "auto",
        minHeight: Height || "auto",
        maxWidth: Width || "auto",
        minWidth: Width || "auto",
      }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Your Notes
        </h1>
        <IoAddCircle
          onClick={addNote}
          className="text-2xl dark:text-white text-black cursor-pointer"
        />
      </div>

      {/* Notes Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`${note.pinned? "bg-yellow-200" : "bg-yellow-100"} border relative border-gray-200 p-4 rounded-md shadow-md drop-shadow-lg`}
          >
            {/* Title Input */}
            <input
              name={`${note.id}-title`}
              type="text"
              className="w-full bg-transparent border-b border-gray-400 text-lg font-semibold mb-2 focus:outline-none"
              placeholder="Title"
              value={note.title}
              onChange={(e) => updateNote(note.id, "title", e.target.value)}
            />

            {/* Content Textarea */}
            <textarea
              name={`${note.id}-content`}
              className="w-full bg-transparent resize-none focus:outline-none"
              placeholder="Your note.."
              rows={6}
              value={note.content}
              onChange={(e) => updateNote(note.id, "content", e.target.value)}
            />

            {note.pinned ? (
              <RiUnpinFill
                className="absolute top-2 right-10 text-lg cursor-pointer text-red-500"
                onClick={() => togglePin(note.id)}
                title="Unpin Note"
              />
            ) : (
              <AiFillPushpin
                className="absolute top-2 right-10 text-lg cursor-pointer text-red-500"
                onClick={() => togglePin(note.id)}
                title="Pin Note"
              />
            )}

            {/* Delete Button */}
            <ImCross title="Remove Note" className="text-red-500 font-bold absolute top-2 right-2" onClick={()=> deleteNote(note.id)}/>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickyNotes;
