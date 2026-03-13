/**
 * Drawer component fixtures
 * Demonstrates the mobile-friendly drawer component (based on vaul)
 */
import React, { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
  DrawerClose,
} from "../Drawer.js";

function BasicDrawerDemo() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h2 className="text-xl font-bold mb-4">Basic Drawer</h2>
      <Drawer>
        <DrawerTrigger asChild>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Open Drawer
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Game Menu</DrawerTitle>
            <DrawerDescription>
              Select an option from the menu below
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-3">
            <button className="w-full p-3 text-left bg-white rounded-lg border hover:bg-slate-50">
              View Rules
            </button>
            <button className="w-full p-3 text-left bg-white rounded-lg border hover:bg-slate-50">
              Game Settings
            </button>
            <button className="w-full p-3 text-left bg-white rounded-lg border hover:bg-slate-50">
              Leave Game
            </button>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <button className="w-full py-2 bg-slate-200 rounded-lg hover:bg-slate-300">
                Close
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function ControlledDrawerDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h2 className="text-xl font-bold mb-4">Controlled Drawer</h2>
      <p className="text-gray-600 mb-4">
        Drawer state: {open ? "Open" : "Closed"}
      </p>

      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        Open Controlled Drawer
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Card Selection</DrawerTitle>
            <DrawerDescription>Select up to 3 cards to pass</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 grid grid-cols-3 gap-3">
            {["♠A", "♥K", "♦Q", "♣J", "♠10", "♥9"].map((card) => (
              <button
                key={card}
                className="p-6 text-2xl bg-white rounded-lg border hover:bg-blue-50 hover:border-blue-300"
              >
                {card}
              </button>
            ))}
          </div>
          <DrawerFooter>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Confirm Selection
            </button>
            <DrawerClose asChild>
              <button className="w-full py-2 bg-slate-200 rounded-lg hover:bg-slate-300">
                Cancel
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default {
  basic: <BasicDrawerDemo />,
  controlled: <ControlledDrawerDemo />,
};
