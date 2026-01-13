import { StyleSheet } from '@react-pdf/renderer';

// Use standard PDF fonts for maximum compatibility and to avoid registration errors
const fontFamily = 'Helvetica';

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: fontFamily,
    fontSize: 10,
    lineHeight: 1.5,
    color: '#020617',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  miniHeader: {
    position: 'absolute',
    top: 20,
    right: 40,
    fontSize: 7,
    color: '#94a3b8',
  },
  logo: {
    width: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#0f172a',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  gridCol: {
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  label: {
    color: '#64748b',
    fontSize: 8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    fontSize: 8,
    alignSelf: 'flex-start',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    padding: 4,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    fontSize: 8,
    color: '#64748b',
  },
});
