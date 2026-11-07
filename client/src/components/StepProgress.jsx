import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function StepProgress({ currentState }) {
  // Map internal states to 4 high-level customer stages
  // Stages:
  // 1: Intake & Triage (NEW, NEEDS_INFO)
  // 2: Investigation & Evidence (INVESTIGATING, ERROR_REVIEW)
  // 3: Merchant Resolution (MERCHANT_ACTION_REQUIRED, MERCHANT_RESPONSE_RECEIVED, ESCALATION_GUIDANCE)
  // 4: Settlement (REFUND_MONITORING, RESOLVED, CLOSED_BY_USER)

  const getStageIndex = (state) => {
    switch (state) {
      case 'NEW':
      case 'NEEDS_INFO':
        return 1;
      case 'INVESTIGATING':
      case 'ERROR_REVIEW':
        return 2;
      case 'MERCHANT_ACTION_REQUIRED':
      case 'MERCHANT_RESPONSE_RECEIVED':
      case 'ESCALATION_GUIDANCE':
        return 3;
      case 'REFUND_MONITORING':
      case 'RESOLVED':
      case 'CLOSED_BY_USER':
        return 4;
      default:
        return 2;
    }
  };

  const currentStage = getStageIndex(currentState);

  const stages = [
    { num: 1, label: 'Intake & Triage' },
    { num: 2, label: 'Evidence & Verification' },
    { num: 3, label: 'Merchant Resolution' },
    { num: 4, label: 'Settlement' }
  ];

  return (
    <div className="step-progress-container">
      <div className="step-progress-track">
        {stages.map((st, idx) => {
          const isCompleted = st.num < currentStage || currentState === 'RESOLVED';
          const isCurrent = st.num === currentStage && currentState !== 'RESOLVED';

          return (
            <React.Fragment key={st.num}>
              <div className={`step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="step-circle">
                  {isCompleted ? <CheckCircle2 size={15} /> : st.num}
                </div>
                <span className="step-label">{st.label}</span>
              </div>
              {idx < stages.length - 1 && (
                <div className={`step-line ${st.num < currentStage ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
