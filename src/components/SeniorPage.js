import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/senior.css";
import { FaUserShield, FaHandHoldingHeart, FaTruck, FaBroom, FaTools, FaRegBuilding, FaShoppingCart, FaSearch } from "react-icons/fa";

const categories = [
  { id: 1, name: "경비·보안·안전", icon: <FaUserShield className="senior-icon" /> },
  { id: 2, name: "돌봄·복지·교육", icon: <FaHandHoldingHeart className="senior-icon" /> },
  { id: 3, name: "운전·배송·이동 서비스", icon: <FaTruck className="senior-icon" /> },
  { id: 4, name: "청소·환경 미화", icon: <FaBroom className="senior-icon" /> },
  { id: 5, name: "생산·기술·제조 보조", icon: <FaTools className="senior-icon" /> },
  { id: 6, name: "사무·행정·고객 응대", icon: <FaRegBuilding className="senior-icon" /> },
  { id: 7, name: "판매·서비스업", icon: <FaShoppingCart className="senior-icon" /> },
  { id: 8, name: "검색", icon: <FaSearch className="senior-icon" />, path: "/search" }, // 검색 페이지 이동
];

function SeniorPage() {
  const navigate = useNavigate();

  const handleClick = (category) => {
    if (category.path) {
      navigate(category.path); // 검색이면 페이지 이동
    } else {
      console.log(`크롤링 수행: ${category.name}`);
      // FastAPI 요청하는 로직 추가
    }
  };

  return (
    <div className="senior-container">
      <h1 className="senior-title">고령자 직무 추천</h1>
      <div className="senior-grid">
        {categories.map((category) => (
          <div key={category.id} className="senior-box" onClick={() => handleClick(category)}>
            {category.icon}
            {category.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SeniorPage;
