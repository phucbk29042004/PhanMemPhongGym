import React, { useState } from 'react';
import {
  Modal, StyleSheet, Text, TouchableOpacity, View,
  FlatList, Dimensions
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Helper to format date
function formatDateDMY(d) {
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateYMD(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DatePickerField({
  label,
  value, // YYYY-MM-DD or DD/MM/YYYY
  onChangeText,
  returnFormat = 'YYYY-MM-DD', // 'YYYY-MM-DD' or 'DD/MM/YYYY'
  placeholder = 'Chọn ngày',
  minDate, // YYYY-MM-DD or Date object
  colors,
  required = false,
  disabled = false
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // Parse initial value to Date object
  const getInitialDate = () => {
    if (!value) return new Date();
    // Check if DD/MM/YYYY
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts.map(Number);
        const parsed = new Date(y, m - 1, d);
        if (!isNaN(parsed)) return parsed;
      }
    } else if (value.includes('-')) {
      // YYYY-MM-DD
      const parsed = new Date(value);
      if (!isNaN(parsed)) return parsed;
    }
    return new Date();
  };

  const initialDate = getInitialDate();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(value ? initialDate : null);

  // Parse minDate
  const getMinDateParsed = () => {
    if (!minDate) return null;
    if (minDate instanceof Date) return minDate;
    if (typeof minDate === 'string') {
      if (minDate.includes('/')) {
        const parts = minDate.split('/');
        const [d, m, y] = parts.map(Number);
        return new Date(y, m - 1, d);
      } else {
        return new Date(minDate);
      }
    }
    return null;
  };
  const minDateParsed = getMinDateParsed();
  if (minDateParsed) {
    minDateParsed.setHours(0, 0, 0, 0);
  }

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday=0, Monday=1...
  
  // Shift Sunday to index 6, Monday to index 0
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = [];

  // Previous month days fill
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
    const month = currentMonth === 0 ? 11 : currentMonth - 1;
    calendarDays.push({ day, month, year, currentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, month: currentMonth, year: currentYear, currentMonth: true });
  }

  // Next month days fill to keep 6 rows (42 cells)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const year = currentMonth === 11 ? currentYear + 1 : currentYear;
    const month = currentMonth === 11 ? 0 : currentMonth + 1;
    calendarDays.push({ day: i, month, year, currentMonth: false });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePrevYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  const handleSelectDay = (item) => {
    const date = new Date(item.year, item.month, item.day);
    if (minDateParsed && date < minDateParsed) {
      return; // Disabled
    }
    setSelectedDate(date);
    const formatted = returnFormat === 'DD/MM/YYYY' ? formatDateDMY(date) : formatDateYMD(date);
    onChangeText(formatted);
    setModalVisible(false);
  };

  const displayValue = selectedDate ? formatDateDMY(selectedDate) : '';

  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
          {required && <Text style={{ color: '#ba1a1a', fontWeight: '700' }}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.pickerTrigger,
          {
            backgroundColor: colors.surfaceVariant || '#f0f4f0',
            borderColor: colors.border || '#cdd8cd',
          },
          disabled && { opacity: 0.6 }
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.valueText, { color: displayValue ? colors.text : (colors.textMuted || '#9cad9c') }]}>
          {displayValue || placeholder}
        </Text>
        <Calendar size={18} color={colors.textMuted || '#9cad9c'} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface || '#ffffff' }]}>
            {/* Modal Header / Month Year Nav */}
            <View style={styles.calendarHeader}>
              <View style={styles.navRow}>
                <TouchableOpacity onPress={handlePrevYear} style={styles.arrowBtn}>
                  <ChevronsLeft size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
                  <ChevronLeft size={18} color={colors.text} />
                </TouchableOpacity>
                
                <Text style={[styles.monthText, { color: colors.text }]}>
                  Tháng {currentMonth + 1}, {currentYear}
                </Text>

                <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
                  <ChevronRight size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextYear} style={styles.arrowBtn}>
                  <ChevronsRight size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdaysRow}>
              {weekdays.map((wd, index) => (
                <Text key={index} style={[styles.weekdayText, { color: colors.textMuted || '#9cad9c' }]}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((item, index) => {
                const date = new Date(item.year, item.month, item.day);
                const isSelected = selectedDate &&
                  selectedDate.getDate() === item.day &&
                  selectedDate.getMonth() === item.month &&
                  selectedDate.getFullYear() === item.year;

                const isToday = new Date().getDate() === item.day &&
                  new Date().getMonth() === item.month &&
                  new Date().getFullYear() === item.year;

                const isDisabled = minDateParsed && date < minDateParsed;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      !item.currentMonth && styles.dayCellOutside,
                      isSelected && { backgroundColor: colors.primary || '#1D9336' },
                      isToday && !isSelected && styles.dayCellToday,
                      isDisabled && styles.dayCellDisabled
                    ]}
                    onPress={() => handleSelectDay(item)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: isSelected ? '#ffffff' : colors.text },
                        !item.currentMonth && { color: colors.textMuted || '#9cad9c', opacity: 0.5 },
                        isDisabled && { color: '#ccc', textDecorationLine: 'line-through' }
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.actionBtn, { borderRightWidth: 1, borderRightColor: colors.border || '#e4ebe4' }]}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  pickerTrigger: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: width - 40,
    maxWidth: 360,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  calendarHeader: {
    marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrowBtn: {
    padding: 8,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '800',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: (width - 72) / 7,
    maxWidth: 44,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: (width - 72) / 7,
    maxWidth: 44,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 4,
  },
  dayCellOutside: {
    opacity: 0.7,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#1D9336',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    borderTopWidth: 1,
    borderTopColor: '#e4ebe4',
    marginTop: 12,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
