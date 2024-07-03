import React, { useState, useEffect } from "react";

const Switch = ({ isOn, onToggle }) => {
  const [switchOn, setSwitchOn] = useState(isOn);

  useEffect(() => {
    setSwitchOn(isOn);
  }, [isOn]);

  const handleToggle = () => {
    setSwitchOn(!switchOn);
    onToggle();
  };

  return (
    <div
      className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer ${
        switchOn ? "bg-green-500" : "bg-gray-300"
      }`}
      onClick={handleToggle}
    >
      <div
        className={`bg-white w-6 h-6 rounded-full shadow-md transform ${
          switchOn ? "translate-x-6" : ""
        }`}
      ></div>
    </div>
  );
};

export default Switch;
