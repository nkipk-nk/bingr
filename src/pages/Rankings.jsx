import RankedList from '../components/RankedList'

export default function Rankings({ library, onOpen, onGoDiscover }) {
  return <RankedList items={Object.values(library)} onOpen={onOpen} showFilter onGoDiscover={onGoDiscover} />
}
