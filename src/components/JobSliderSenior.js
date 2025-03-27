const JobSliderSenior = ({ jobListings }) => {
    return (
      <div>
        <h2>시니어 채용 공고 목록</h2>
        {jobListings.map((job, idx) => (
          <div key={idx} style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
            <h3>{job.institution}</h3>
            <p>{job.title}</p>
            <a href={job.link} target="_blank" rel="noopener noreferrer">
              상세 보기
            </a>
          </div>
        ))}
      </div>
    );
  };
  export default JobSliderSenior;