import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import "../styles/senior.css";

function SeniorResultsPage() {
  const { categoryId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryName = queryParams.get('name'); // URL에 전달된 category.name

  const [crawlData, setCrawlData] = useState([]);
  const [jobData, setJobData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('최신 교육 정보를 불러오는 중...');

  // 크롤링 데이터 가져오기 함수 (categoryName이 없을 때 사용)
  const fetchCrawlData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/crawl-data-senior');
      if (response.data && Array.isArray(response.data.data)) {
        setCrawlData(response.data.data);
      } else {
        setCrawlData([]);
        console.error('크롤링 데이터가 올바른 형식이 아닙니다:', response.data);
      }
    } catch (error) {
      console.error('크롤링 데이터 가져오기 실패:', error);
      setCrawlData([]);
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  // categoryName이 전달된 경우, 직무 검색 데이터를 가져오는 함수
  const fetchJobData = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/jobs_senior?id=${categoryId}&keyword=${encodeURIComponent(categoryName)}`);
      if (response.data && response.data.jobs) {
        setJobData(response.data.jobs);
      } else {
        setJobData([]);
        console.error('직무 데이터 형식 오류:', response.data);
      }
    } catch (error) {
      console.error('직무 데이터 가져오기 실패:', error);
      setJobData([]);
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  useEffect(() => {
    if (categoryName) {
      fetchJobData();
    } else {
      axios.post(`http://localhost:8000/start-crawling-senior-dynamic?id=${categoryId}`)
        .then(() => {
          const interval = setInterval(() => {
            axios.get("http://localhost:8000/crawl-progress-senior")
              .then(res => {
                if (res.data) {
                  setProgress(res.data.progress || 0);
                  setStatus(res.data.status || '');
                  if (res.data.completed) {
                    clearInterval(interval);
                    fetchCrawlData();
                  }
                }
              })
              .catch(err => {
                console.error("진행 상황 가져오기 실패:", err);
              });
          }, 2000);
        })
        .catch(err => {
          console.error("동적 크롤링 시작 실패:", err);
          setIsLoading(false);
        });
    }
  }, [categoryId, categoryName]);

  return (
    <div className="senior-container">
      <h1 className="senior-title">
        {categoryName ? `${categoryName} 관련 직무 검색 결과` : '직무 검색 결과'}
      </h1>
      {isLoading ? (
        <div className="loading">
          <p>{status}</p>
          <p>진행률: {progress}%</p>
        </div>
      ) : (
        <div className="senior-data-grid">
          {categoryName ? (
            jobData && jobData.length > 0 ? (
              jobData.map((job, idx) => (
                <div key={idx} className="senior-data-box">
                  {/* job.source가 실제 직무 데이터의 출처 */}
                  <div className="data-category">{job.source || "정보 없음"}</div>
                  {/* job.second_link를 사용하여 링크 연결 */}
                  <a
                    href={job.second_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="data-title"
                  >
                    {/* job.data 배열의 첫 번째 요소를 제목으로 사용 */}
                    {job.data && job.data.length > 0 ? job.data[0] : "제목 없음"}
                  </a>
                  {/* job.location을 기관 또는 위치 정보로 사용 */}
                  <div className="data-institution">{job.location || "위치 정보 없음"}</div>
                </div>
              ))
            ) : (
              <p>데이터가 없습니다.</p>
            )
          ) : (
            crawlData && crawlData.length > 0 ? (
              crawlData.map((item, idx) => (
                <div key={idx} className="senior-data-box">
                  <div className="data-category">{item.category}</div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="data-title"
                  >
                    {item.title}
                  </a>
                  <div className="data-institution">{item.institution}</div>
                </div>
              ))
            ) : (
              <p>데이터가 없습니다.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default SeniorResultsPage;
