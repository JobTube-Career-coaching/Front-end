import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/YouTubeSearch.css'; // 스타일 공유
import JobSlider from './JobSlider';
import { useLocation } from 'react-router-dom';
import JobSliderSenior from './JobSliderSenior';
import { Search } from 'lucide-react';


function SeniorSearch() {
  const [keyword, setKeyword] = useState('');
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const [modestr, setModeStr] = useState('');
  const [mode2, SetMode2] = useState("default")
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode_ = params.get('from_mode');
    if (mode_ == '1') {
      setModeStr('[고령자 모드]');
      SetMode2("senior")
    } else if (mode_ === '2') {
      setModeStr('[장애인 모드]');
      SetMode2("disabled")
    } else {
      setModeStr('[일반 모드]');
    }
    console.log("mode2", mode_)
  }, [location.search]);
  const handleSearch = async (inputKeyword) => {
    const searchKeyword = inputKeyword || keyword;

    if (!searchKeyword.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);
    setJobListings([]);
    let url = `http://localhost:8000/start-crawling-${mode2}-dynamic?id=-1&keyword=${encodeURIComponent(searchKeyword)}`
    try {
      // 1. 크롤링 시작 & task_id 받아오기
      const startRes = await axios.post(url
      );

      const taskId = startRes.data?.task_id;
      if (!taskId) {
        throw new Error("task_id를 받지 못했어요!");
      }

      // 2. 대기 + 폴링으로 결과 받기
      const maxTries = 100;
      let tries = 0;
      let result = [];

      while (tries < maxTries) {
        const res = await axios.get(`http://localhost:8000/crawl-progress-${mode2}?task_id=${taskId}`);
        const dataRes = await axios.get(`http://localhost:8000/crawl-data-${mode2}?task_id=${taskId}`);

        let rawData = dataRes?.data?.data || [];

        if (!Array.isArray(rawData)) {
          const firstKey = Object.keys(rawData)[0];
          if (firstKey && Array.isArray(rawData[firstKey]?.data)) {
            rawData = rawData[firstKey].data;
          } else {
            rawData = [];
          }
        }
        console.log("🟡 크롤링 상태:", res.data);
        console.log("🟢 데이터 응답 구조:", dataRes.data);
        console.log("🟣 추출된 result 길이:", rawData?.length);

        if (rawData.length > 0) {
          result = rawData;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      }

      if (result.length > 0) {
        setJobListings(result);
      } else {
        setError('관련된 직무가 없습니다.');
      }

    } catch (error) {
      console.error('Search error:', error);
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="search-container">
      <div className="search-wrapper">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={"직무 키워드를 입력하세요" + modestr}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
              disabled={loading}
            />
            <button
              onClick={() => handleSearch()}
              className="search-button"
              disabled={loading}
            >
              <Search size={24} />
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loader"></div>
            <p className="loading-text">검색 중...</p>
          </div>
        )}

        {!loading && jobListings.length > 0 && (
          <JobSliderSenior Name={modestr} jobListings={jobListings} />
        )}

        {!loading && !error && jobListings.length === 0 && keyword && (
          <div className="no-results">
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeniorSearch;