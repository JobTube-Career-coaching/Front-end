import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import '../styles/YouTubeSearch.css';
import JobSlider from '../components/JobSlider';
import { useLocation } from 'react-router-dom';
function YouTubeSearch() {
    const [keyword, setKeyword] = useState('');
    const [videosByCategory, setVideosByCategory] = useState({});
    const [categorySummaries, setCategorySummaries] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingCategorySummary, setLoadingCategorySummary] = useState(null);
    const [jobListings, setJobListings] = useState([]);
    const [error, setError] = useState('');
    const location = useLocation();
    const [indexKeyword,setindKeyword ]=useState('');
     // URL 쿼리 추출
    const params = new URLSearchParams(location.search);
    setindKeyword(params.get("from_senior"));

    const handleSearch = async () => {
        // 검색어 유효성 검사
        if (!keyword.trim()) {
            setError('검색어를 입력해주세요.');
            return;
        }

        // 상태 초기화
        setError('');
        setLoading(true);
        setVideosByCategory({});
        setJobListings([]);
        setCategorySummaries({});
        let videosResponse, jobsResponse;

        try {
            try {
                if (indexKeyword) {
                    axios.get(`http://localhost:8000/jobs_search_senior?keyword=${encodeURIComponent(indexKeyword)}`);
                }
                [videosResponse, jobsResponse] = await Promise.all([
                    axios.get(`http://localhost:8000/search-categories?keyword=${encodeURIComponent(keyword)}`),
                    axios.get(`http://localhost:8000/jobs?keyword=${encodeURIComponent(keyword)}`)
                ]);
            } catch (apiError) {
                console.error('API Error:', apiError);
                throw new Error('API 요청 실패');
            }
    
            // 응답이 있는지 확인 후 데이터 설정
            if (videosResponse && videosResponse.data) {
                setVideosByCategory(videosResponse.data);
            }
    
            if (jobsResponse && jobsResponse.data && jobsResponse.data.jobs) {
                setJobListings(jobsResponse.data.jobs);
            }
    
            // 데이터가 없는 경우 에러 메시지 설정
            const hasVideos = videosResponse?.data && Object.keys(videosResponse.data).length > 0;
            const hasJobs = jobsResponse?.data?.jobs && jobsResponse.data.jobs.length > 0;
            
            if (!hasVideos && !hasJobs) {
                setError('검색 결과가 없습니다.');
            }
        } catch (error) {
            console.error('Search error:', error);
            setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
            setVideosByCategory({});
            setJobListings([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategorySummary = async (categoryId) => {
        if (loadingCategorySummary) return;
        
        setLoadingCategorySummary(categoryId);
        try {
            // 해당 카테고리의 모든 영상 ID 수집
            const videoIds = videosByCategory[categoryId].videos.map(video => video.video_id);
            
            const response = await axios.post(`http://localhost:8000/compare-category`, {
                video_data_list: videoIds.map(videoId => ({
                    video_id: videoId,
                    keyword: keyword,
                    category: categoryId
                })),
                category_name: categoryId
            });
            
            setCategorySummaries(prev => ({
                ...prev,
                [categoryId]: response.data.comparison || '이 카테고리의 영상들에 대한 요약 정보를 찾을 수 없습니다.'
            }));
        } catch (error) {
            console.error('Category Summary error:', error);
            setCategorySummaries(prev => ({
                ...prev,
                [categoryId]: '카테고리 요약 정보를 가져오는 중 오류가 발생했습니다.'
            }));
        } finally {
            setLoadingCategorySummary(null);
        }
    };

    // 카테고리 이름을 사용자 친화적으로 표시
    const getCategoryDisplayName = (categoryId) => {
        const categoryMap = {
            "pros_cons": "장단점",
            "how_to": "준비방법",
            "review": "후기"
        };
        return categoryMap[categoryId] || categoryId;
    };


    return (
        <div className="search-container">
            <div className="search-wrapper">
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

                {loading && (
                    <div className="loading-container">
                        <div className="loader"></div>
                        <p className="loading-text">검색 중...</p>
                    </div>
                )}

                {!loading && (
                    <div className="results-container">
                        {Object.keys(videosByCategory).length > 0 && (
                            <div className="results-section">                                
                                {Object.keys(videosByCategory).map((categoryId) => (
                                    <div key={categoryId} className="category-section">
                                        <div className="category-header">
                                            <h3 className="category-title">
                                                {getCategoryDisplayName(categoryId)} 
                                            </h3>
                                            <button
                                                onClick={() => fetchCategorySummary(categoryId)}
                                                className="category-summary-button"
                                                disabled={loadingCategorySummary === categoryId}
                                            >
                                                {loadingCategorySummary === categoryId ? '요약 불러오는 중...' : '이 카테고리 요약 보기'}
                                            </button>
                                        </div>
                                        
                                        {categorySummaries[categoryId] && (
                                            <div className="category-summary">
                                                <div dangerouslySetInnerHTML={{ __html: categorySummaries[categoryId] }} />
                                            </div>
                                        )}

                                        <div className="videos-grid">
                                            {videosByCategory[categoryId].videos.map((video) => (
                                                <div key={video.video_id} className="video-card">
                                                    <div className="video-content">
                                                        <img
                                                            src={video.thumbnails?.default?.url || 'placeholder-image.jpg'}
                                                            alt="thumbnail"
                                                            className="video-thumbnail"
                                                        />
                                                        <div className="video-info">
                                                                <h3 className="video-title">{video.title}</h3>
                                                            <p className="channel-name">{video.channel}</p>
                                                            <div className="video-stats">
                                                                <span>조회수: {video.view_count.toLocaleString()}</span>
                                                                <span>좋아요: {video.like_count.toLocaleString()}</span>
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
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {jobListings.length > 0 && (
                            <JobSlider jobListings={jobListings} />
                        )}

                        {!loading && !error && Object.keys(videosByCategory).length === 0 && jobListings.length === 0 && keyword && (
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

export default YouTubeSearch;