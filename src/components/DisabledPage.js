import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import '../styles/d_serch.css';
import JobSlider from '../components/JobSlider';

function DisabledPage() {
    const [keyword, setKeyword] = useState('');
    const [videos, setVideos] = useState([]);
    const [summaries, setSummaries] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(null);
    const [jobListings, setJobListings] = useState([]);
    const [error, setError] = useState('');
    const [crawlData, setCrawlData] = useState([]);
    const [isCrawlLoading, setIsCrawlLoading] = useState(true);
    const [crawlProgress, setCrawlProgress] = useState(0);
    const [crawlStatus, setCrawlStatus] = useState('최신 교육 정보를 불러오는 중...');

    // 크롤링 진행 상황을 주기적으로 확인하는 함수
    const fetchCrawlProgress = async () => {
        try {
            const response = await axios.get('http://localhost:8000/crawl-progress');
            if (response.data) {
                setCrawlProgress(response.data.progress || 0);
                setCrawlStatus(response.data.status || '크롤링 중...');
                
                // 크롤링이 완료되면 크롤링 데이터 가져오기
                if (response.data.completed) {
                    fetchCrawlData();
                    return true; // 크롤링 완료
                }
            }
            return false; // 크롤링 진행 중
        } catch (error) {
            console.error('크롤링 진행 상황 확인 실패:', error);
            setCrawlStatus('진행 상황 확인 중 오류 발생');
            return false;
        }
    };

    const fetchCrawlData = async () => {
        try {
            const response = await axios.get('http://localhost:8000/crawl-data');
            // response.data.data로 접근하도록 수정
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
            setIsCrawlLoading(false);
            setCrawlProgress(100); // 완료 표시
        }
    };

    // 크롤링 시작 함수
    const startCrawling = async () => {
        setIsCrawlLoading(true);
        setCrawlProgress(0);
        setCrawlStatus('크롤링 시작 중...');
        
        try {
            // 백엔드에 크롤링 요청 보내기
            await axios.post('http://localhost:8000/start-crawling');
            
            // 크롤링 진행 상황 주기적으로 확인
            const checkProgress = async () => {
                const completed = await fetchCrawlProgress();
                if (!completed) {
                    // 아직 완료되지 않았으면 1초 후 다시 확인
                    setTimeout(checkProgress, 1000);
                }
            };
            
            checkProgress();
        } catch (error) {
            console.error('크롤링 시작 실패:', error);
            setCrawlStatus('크롤링 시작 중 오류 발생');
            setIsCrawlLoading(false);
        }
    };

    useEffect(() => {
        // 페이지 로드 시 크롤링 시작 또는 데이터 가져오기
        startCrawling();
        
        // 컴포넌트 언마운트 시 정리
        return () => {
            // 필요한 정리 작업이 있으면 여기에 추가
        };
    }, []);

    const handleSearch = async () => {
        if (!keyword.trim()) {
            setError('검색어를 입력해주세요.');
            return;
        }

        setError('');
        setLoading(true);
        setVideos([]);
        setJobListings([]);
        setSummaries({});

        try {
            const [videosResponse, jobsResponse] = await Promise.all([
                axios.get(`http://localhost:8000/disability-search?keyword=${keyword}`),
                axios.get(`http://localhost:8000/disability-jobs?keyword=${keyword}`)
            ]);

            if (videosResponse?.data) {
                setVideos(videosResponse.data);
            }

            if (jobsResponse?.data?.jobs) {
                setJobListings(jobsResponse.data.jobs);
            }

            if ((!videosResponse?.data || videosResponse.data.length === 0) && 
                (!jobsResponse?.data?.jobs || jobsResponse.data.jobs.length === 0)) {
                setError('검색 결과가 없습니다.');
            }

        } catch (error) {
            console.error('Search error:', error);
            setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
            setVideos([]);
            setJobListings([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async (videoId) => {
        if (loadingSummary) return;

        setLoadingSummary(videoId);
        try {
            const response = await axios.get(`http://localhost:8000/transcript/${videoId}`);
            setSummaries(prev => ({
                ...prev,
                [videoId]: response.data.transcript || '요약 정보를 찾을 수 없습니다.'
            }));
        } catch (error) {
            console.error('Summary error:', error);
            setSummaries(prev => ({
                ...prev,
                [videoId]: '요약 정보를 가져오는 중 오류가 발생했습니다.'
            }));
        } finally {
            setLoadingSummary(null);
        }
    };

    return (
        <div className="search-container">
            <div className="search-wrapper">
                {/* 크롤링 데이터 출력 */}
                <div className="crawl-results">
                    <h3>최신 교육 정보</h3>
                    {isCrawlLoading ? (
                        <div className="crawl-loading">
                            {/* 게이지 바 스타일로 수정 */}
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ 
                                        width: `${crawlProgress}%`,
                                        height: '100%',
                                        backgroundColor: '#3b82f6',
                                        borderRadius: '6px',
                                        transition: 'width 0.5s ease-in-out'
                                    }}
                                ></div>
                            </div>
                            <p className="loading-text">{crawlStatus} ({crawlProgress}%)</p>
                        </div>
                    ) : (
                        <div className="crawl-container">
                            <ul className="crawl-list" style={{ listStyle: "none", padding: 0 }}>
                                {Array.isArray(crawlData) && crawlData.length > 0 ? (
                                    crawlData.map((item, index) => (
                                        <li key={index} className="crawl-item">
                                            <span className="category">{item.category}</span>
                                            {item.link ? (
                                                <a 
                                                    href={`https://www.worktogether.or.kr/${item.link}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ textDecoration: "none", color: "inherit" }}
                                                >
                                                    <h4>{item.title}</h4>
                                                </a>
                                            ) : (
                                                <h4>{item.title}</h4>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <li>현재 표시할 교육 정보가 없습니다.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* 검색 입력 및 버튼 */}
                <div className="search-section">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="검색어를 입력하세요"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="search-input"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSearch}
                            className="search-button"
                            disabled={loading}
                        >
                            <Search size={24} />
                        </button>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                </div>

                {/* 검색 결과 및 로딩 상태 - 게이지 바 스타일로 수정 */}
                {loading && (
                    <div className="loading-container">
                        <div className="progress-bar-search"></div>
                        <p className="loading-text">검색 중...</p>
                    </div>
                )}

                {/* 검색 결과 */}
                {!loading && (
                    <div className="results-container">
                        {videos.length > 0 && (
                            <div className="results-section">
                                <h2 className="section-title">동영상 검색 결과</h2>
                                <div className="videos-grid">
                                    {videos.map((video) => (
                                        <div key={video.video_id} className="video-card">
                                            <div className="video-content">
                                                <img
                                                    src={video.thumbnails.default.url}
                                                    alt="thumbnail"
                                                    className="video-thumbnail"
                                                />
                                                <div className="video-info">
                                                    <h3 className="video-title">{video.title}</h3>
                                                    <p className="channel-name">{video.channel}</p>
                                                    <div className="video-stats">
                                                        <span>조회수: {video.view_count}</span>
                                                        <span>좋아요: {video.like_count}</span>
                                                    </div>
                                                    <div className="video-actions">
                                                        <a
                                                            href={video.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="video-link"
                                                        >
                                                            YouTube에서 보기
                                                        </a>
                                                        <button
                                                            onClick={() => fetchSummary(video.video_id)}
                                                            className="summary-button"
                                                            disabled={loadingSummary === video.video_id}
                                                        >
                                                            {loadingSummary === video.video_id ? (
                                                                <>
                                                                    {/* 요약 로딩 시 게이지 바 스타일 적용 */}
                                                                    <div className="progress-bar" style={{width: '60px', height: '6px', display: 'inline-block', verticalAlign: 'middle', marginRight: '5px'}}></div>
                                                                    요약 불러오는 중...
                                                                </>
                                                            ) : '요약 보기'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {summaries[video.video_id] && (
                                                <div className="video-summary">
                                                    <div dangerouslySetInnerHTML={{ __html: summaries[video.video_id] }} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {jobListings.length > 0 && (
                            <JobSlider jobListings={jobListings} />
                        )}

                        {!loading && !error && videos.length === 0 && jobListings.length === 0 && keyword && (
                            <div className="no-results">
                                <p>검색 버튼 또는 ENTER 눌러주세요.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DisabledPage;