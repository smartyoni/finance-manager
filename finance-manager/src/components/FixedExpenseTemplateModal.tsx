import React, { useState } from 'react';
import { FixedExpenseTemplate } from '../types';

interface FixedExpenseTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: FixedExpenseTemplate[];
  onUpdate: (templates: FixedExpenseTemplate[]) => void;
}

const FixedExpenseTemplateModal: React.FC<FixedExpenseTemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  onUpdate
}) => {
  const [editingTemplates, setEditingTemplates] = useState<FixedExpenseTemplate[]>(templates);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    amount: 0,
    paymentDate: '01'
  });

  const handleSave = () => {
    onUpdate(editingTemplates);
    onClose();
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name) return;
    
    const template: FixedExpenseTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      amount: newTemplate.amount,
      paymentDate: newTemplate.paymentDate,
      active: true
    };
    
    setEditingTemplates([...editingTemplates, template]);
    setNewTemplate({ name: '', amount: 0, paymentDate: '01' });
  };

  const handleUpdateTemplate = (id: string, field: keyof FixedExpenseTemplate, value: any) => {
    setEditingTemplates(prev => 
      prev.map(template => 
        template.id === id ? { ...template, [field]: value } : template
      )
    );
  };

  const handleDeleteTemplate = (id: string) => {
    setEditingTemplates(prev => prev.filter(template => template.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>고정지출 템플릿 관리</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="template-form">
            <h3>새 템플릿 추가</h3>
            <div className="template-inputs">
              <input
                type="text"
                placeholder="항목명"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="notion-input-small"
              />
              <input
                type="text"
                placeholder="금액"
                value={newTemplate.amount ? newTemplate.amount.toLocaleString() : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(value)) && value !== '') {
                    setNewTemplate(prev => ({ ...prev, amount: Number(value) }));
                  } else if (value === '') {
                    setNewTemplate(prev => ({ ...prev, amount: 0 }));
                  }
                }}
                className="notion-input-small"
              />
              <select
                value={newTemplate.paymentDate}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, paymentDate: e.target.value }))}
                className="notion-input-small"
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                    {i + 1}일
                  </option>
                ))}
              </select>
              <button onClick={handleAddTemplate} className="add-button">추가</button>
            </div>
          </div>

          <div className="template-list">
            <h3>기존 템플릿</h3>
            {editingTemplates.length === 0 ? (
              <p>등록된 템플릿이 없습니다.</p>
            ) : (
              <table className="notion-table">
                <thead>
                  <tr>
                    <th>활성화</th>
                    <th>항목</th>
                    <th>금액</th>
                    <th>결제일</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {editingTemplates.map(template => (
                    <tr key={template.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={template.active}
                          onChange={(e) => handleUpdateTemplate(template.id, 'active', e.target.checked)}
                          className="notion-checkbox"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={template.name}
                          onChange={(e) => handleUpdateTemplate(template.id, 'name', e.target.value)}
                          className="notion-input-small"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={template.amount ? template.amount.toLocaleString() : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, '');
                            if (!isNaN(Number(value)) && value !== '') {
                              handleUpdateTemplate(template.id, 'amount', Number(value));
                            } else if (value === '') {
                              handleUpdateTemplate(template.id, 'amount', 0);
                            }
                          }}
                          className="notion-input-small"
                        />
                      </td>
                      <td>
                        <select
                          value={template.paymentDate}
                          onChange={(e) => handleUpdateTemplate(template.id, 'paymentDate', e.target.value)}
                          className="notion-input-small"
                        >
                          {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                              {i + 1}일
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="delete-button"
                          style={{ opacity: 1 }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-button">취소</button>
          <button onClick={handleSave} className="save-button">저장</button>
        </div>
      </div>
    </div>
  );
};

export default FixedExpenseTemplateModal;