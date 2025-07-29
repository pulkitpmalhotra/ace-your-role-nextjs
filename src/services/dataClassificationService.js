class DataClassificationService {
  static classifyData(data, dataType) {
    const classifications = {
      personal: ['email', 'name', 'phone', 'address'],
      sensitive: ['conversation', 'performance_data', 'feedback'],
      technical: ['ip_address', 'user_agent', 'session_logs'],
      behavioral: ['click_patterns', 'usage_metrics', 'preferences']
    };

    return Object.entries(classifications).reduce((result, [category, fields]) => {
      const categoryData = {};
      fields.forEach(field => {
        if (data[field] !== undefined) {
          categoryData[field] = data[field];
        }
      });
      
      if (Object.keys(categoryData).length > 0) {
        result[category] = {
          data: categoryData,
          retention: this.getRetentionPeriod(category),
          classification: this.getSensitivityLevel(category)
        };
      }
      
      return result;
    }, {});
  }

  static getRetentionPeriod(category) {
    const periods = {
      personal: 'Until account deletion',
      sensitive: '90 days (auto-delete)',
      technical: '30 days',
      behavioral: '2 years'
    };
    return periods[category] || '90 days';
  }

  static getSensitivityLevel(category) {
    const levels = {
      personal: 'high',
      sensitive: 'high', 
      technical: 'medium',
      behavioral: 'low'
    };
    return levels[category] || 'medium';
  }

  static generateRetentionSchedule(userData) {
    const schedule = [];
    const classifications = this.classifyData(userData, 'user');
    
    Object.entries(classifications).forEach(([category, info]) => {
      if (info.retention.includes('days')) {
        const days = parseInt(info.retention.match(/\d+/)[0]);
        const deleteDate = new Date();
        deleteDate.setDate(deleteDate.getDate() + days);
        
        schedule.push({
          category,
          deleteDate: deleteDate.toISOString(),
          dataTypes: Object.keys(info.data)
        });
      }
    });
    
    return schedule;
  }
}

export default DataClassificationService;
