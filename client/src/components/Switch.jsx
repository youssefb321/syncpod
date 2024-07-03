import React from "react";
import PropTypes from "prop-types";

const Switch = ({ isOn, handleToggle }) => {
  return (
    <div
      className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer ${
        isOn ? "bg-green-500" : "bg-gray-300"
      }`}
      onClick={handleToggle}
    >
      <div
        className={`bg-white w-6 h-6 rounded-full shadow-md transform ${
          isOn ? "translate-x-6" : ""
        }`}
      ></div>
    </div>
  );
};

Switch.propTypes = {
  isOn: PropTypes.bool.isRequired,
  handleToggle: PropTypes.func.isRequired,
};

export default Switch;
